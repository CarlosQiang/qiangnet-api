/**
 * Servicio de aplicaciones
 *
 * Este archivo contiene la lógica de negocio para las operaciones
 * relacionadas con aplicaciones como listar, gestionar acceso, etc.
 */

const applicationModel = require("../models/applicationModel")
const userModel = require("../models/userModel")
const { generateToken } = require("../config/jwt")
const { AppError } = require("../middleware/errorHandler")
const logger = require("../utils/logger")

/**
 * Obtener lista de aplicaciones
 */
const getApplications = async ({ page = 1, limit = 10, sortBy = "name", sortOrder = "asc", userId = null }) => {
  const offset = (page - 1) * limit

  // Obtener aplicaciones
  const applications = await applicationModel.findMany({
    limit,
    offset,
    sortBy,
    sortOrder,
    userId, // Para filtrar según permisos del usuario
  })

  // Obtener total de aplicaciones para paginación
  const total = await applicationModel.count({ userId })

  // Si hay un usuario autenticado, verificar acceso a cada aplicación
  if (userId) {
    const applicationsWithAccess = await Promise.all(
      applications.map(async (app) => {
        const hasAccess = await applicationModel.checkUserAccess(userId, app.id)
        return {
          ...app,
          hasAccess,
        }
      }),
    )

    return {
      applications: applicationsWithAccess,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  return {
    applications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}

/**
 * Obtener aplicación por ID
 */
const getApplicationById = async (applicationId, userId = null) => {
  const application = await applicationModel.findById(applicationId)

  if (!application) {
    return null
  }

  // Si hay un usuario autenticado, verificar acceso
  if (userId) {
    const hasAccess = await applicationModel.checkUserAccess(userId, applicationId)
    return {
      ...application,
      hasAccess,
    }
  }

  return application
}

/**
 * Obtener aplicaciones del usuario
 */
const getUserApplications = async (userId) => {
  const applications = await applicationModel.findByUserId(userId)
  return applications
}

/**
 * Solicitar acceso a una aplicación
 */
const requestAccess = async (userId, applicationId) => {
  // Verificar que la aplicación existe
  const application = await applicationModel.findById(applicationId)
  if (!application) {
    throw AppError.notFound("Aplicación no encontrada")
  }

  // Verificar que el usuario existe
  const user = await userModel.findById(userId)
  if (!user) {
    throw AppError.notFound("Usuario no encontrado")
  }

  // Verificar si ya tiene acceso
  const existingAccess = await applicationModel.findUserAccess(userId, applicationId)
  if (existingAccess) {
    if (existingAccess.status === "approved") {
      throw AppError.badRequest("Ya tienes acceso a esta aplicación")
    }
    if (existingAccess.status === "pending") {
      throw AppError.badRequest("Ya tienes una solicitud pendiente para esta aplicación")
    }
  }

  // Crear solicitud de acceso
  const accessRequest = await applicationModel.createAccessRequest({
    userId,
    applicationId,
    status: "pending",
  })

  return accessRequest
}

/**
 * Verificar acceso a una aplicación
 */
const checkAccess = async (userId, applicationId) => {
  const access = await applicationModel.findUserAccess(userId, applicationId)
  return access && access.status === "approved"
}

/**
 * Lanzar una aplicación
 */
const launchApplication = async (userId, applicationId) => {
  // Verificar acceso
  const hasAccess = await checkAccess(userId, applicationId)
  if (!hasAccess) {
    throw AppError.forbidden("No tienes acceso a esta aplicación")
  }

  // Obtener aplicación
  const application = await applicationModel.findById(applicationId)
  if (!application) {
    throw AppError.notFound("Aplicación no encontrada")
  }

  // Obtener usuario
  const user = await userModel.findById(userId)
  if (!user) {
    throw AppError.notFound("Usuario no encontrado")
  }

  // Generar token de aplicación (con tiempo de vida corto)
  const appToken = generateToken(
    {
      userId: user.id,
      username: user.username,
      applicationId: application.id,
      type: "app_access",
    },
    "1h", // Token válido por 1 hora
  )

  // Registrar lanzamiento
  await applicationModel.logApplicationLaunch(userId, applicationId)

  return {
    application: {
      id: application.id,
      name: application.name,
      url: application.url,
      description: application.description,
    },
    launchUrl: `${application.url}?token=${appToken}`,
    token: appToken,
    expiresIn: 3600, // 1 hora en segundos
  }
}

/**
 * Crear nueva aplicación (admin)
 */
const createApplication = async (applicationData) => {
  // Validar datos requeridos
  if (!applicationData.name || !applicationData.url) {
    throw AppError.validation("Nombre y URL son requeridos")
  }

  // Verificar si ya existe una aplicación con el mismo nombre
  const existingApp = await applicationModel.findByName(applicationData.name)
  if (existingApp) {
    throw AppError.conflict("Ya existe una aplicación con ese nombre")
  }

  const application = await applicationModel.create(applicationData)
  return application
}

/**
 * Actualizar aplicación (admin)
 */
const updateApplication = async (applicationId, updateData) => {
  const application = await applicationModel.findById(applicationId)
  if (!application) {
    throw AppError.notFound("Aplicación no encontrada")
  }

  // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre
  if (updateData.name && updateData.name !== application.name) {
    const existingApp = await applicationModel.findByName(updateData.name)
    if (existingApp) {
      throw AppError.conflict("Ya existe una aplicación con ese nombre")
    }
  }

  const updatedApplication = await applicationModel.update(applicationId, updateData)
  return updatedApplication
}

/**
 * Eliminar aplicación (admin)
 */
const deleteApplication = async (applicationId) => {
  const application = await applicationModel.findById(applicationId)
  if (!application) {
    throw AppError.notFound("Aplicación no encontrada")
  }

  await applicationModel.delete(applicationId)
}

/**
 * Aprobar acceso de usuario a aplicación (admin)
 */
const approveUserAccess = async (userId, applicationId) => {
  // Verificar que la solicitud existe
  const accessRequest = await applicationModel.findUserAccess(userId, applicationId)
  if (!accessRequest) {
    throw AppError.notFound("Solicitud de acceso no encontrada")
  }

  if (accessRequest.status === "approved") {
    throw AppError.badRequest("El acceso ya está aprobado")
  }

  await applicationModel.updateAccessRequest(userId, applicationId, {
    status: "approved",
    approvedAt: new Date(),
  })
}

/**
 * Revocar acceso de usuario a aplicación (admin)
 */
const revokeUserAccess = async (userId, applicationId) => {
  const accessRequest = await applicationModel.findUserAccess(userId, applicationId)
  if (!accessRequest) {
    throw AppError.notFound("Acceso no encontrado")
  }

  await applicationModel.updateAccessRequest(userId, applicationId, {
    status: "revoked",
    revokedAt: new Date(),
  })
}

module.exports = {
  getApplications,
  getApplicationById,
  getUserApplications,
  requestAccess,
  checkAccess,
  launchApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  approveUserAccess,
  revokeUserAccess,
}

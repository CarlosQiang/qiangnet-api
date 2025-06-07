/**
 * Controlador de aplicaciones
 *
 * Este archivo contiene los controladores para manejar las operaciones
 * relacionadas con aplicaciones como listar, obtener detalles, gestionar acceso, etc.
 */

const applicationService = require("../services/applicationService")
const { AppError } = require("../middleware/errorHandler")
const logger = require("../utils/logger")

/**
 * Obtener lista de aplicaciones disponibles
 */
const getApplications = async (req, res) => {
  const { page, limit, sortBy, sortOrder } = req.query
  const userId = req.user?.id // Usuario opcional

  try {
    const result = await applicationService.getApplications({
      page: Number.parseInt(page) || 1,
      limit: Number.parseInt(limit) || 10,
      sortBy: sortBy || "name",
      sortOrder: sortOrder || "asc",
      userId, // Para filtrar aplicaciones según permisos del usuario
    })

    res.json(result)
  } catch (error) {
    logger.error("Error obteniendo aplicaciones:", error)
    throw error
  }
}

/**
 * Obtener detalles de una aplicación
 */
const getApplicationById = async (req, res) => {
  const { id } = req.params
  const userId = req.user?.id

  try {
    const application = await applicationService.getApplicationById(id, userId)

    if (!application) {
      throw AppError.notFound("Aplicación no encontrada")
    }

    res.json({ application })
  } catch (error) {
    logger.error("Error obteniendo aplicación por ID:", error)
    throw error
  }
}

/**
 * Obtener aplicaciones del usuario actual
 */
const getUserApplications = async (req, res) => {
  const userId = req.user.id

  try {
    const applications = await applicationService.getUserApplications(userId)

    res.json({ applications })
  } catch (error) {
    logger.error("Error obteniendo aplicaciones del usuario:", error)
    throw error
  }
}

/**
 * Solicitar acceso a una aplicación
 */
const requestAccess = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const request = await applicationService.requestAccess(userId, id)

    // Registrar solicitud de acceso
    logger.audit("Solicitud de acceso a aplicación", {
      userId,
      username: req.user.username,
      applicationId: id,
      ip: req.ip,
    })

    res.json({
      message: "Solicitud de acceso enviada exitosamente",
      request,
    })
  } catch (error) {
    logger.error("Error solicitando acceso:", error)
    throw error
  }
}

/**
 * Verificar acceso a una aplicación
 */
const checkAccess = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const hasAccess = await applicationService.checkAccess(userId, id)

    res.json({ hasAccess })
  } catch (error) {
    logger.error("Error verificando acceso:", error)
    throw error
  }
}

/**
 * Lanzar una aplicación (obtener URL y token)
 */
const launchApplication = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const launchData = await applicationService.launchApplication(userId, id)

    // Registrar lanzamiento de aplicación
    logger.audit("Aplicación lanzada", {
      userId,
      username: req.user.username,
      applicationId: id,
      ip: req.ip,
    })

    res.json(launchData)
  } catch (error) {
    logger.error("Error lanzando aplicación:", error)
    throw error
  }
}

/**
 * Crear una nueva aplicación (admin)
 */
const createApplication = async (req, res) => {
  const applicationData = req.body

  try {
    const application = await applicationService.createApplication(applicationData)

    // Registrar creación de aplicación
    logger.audit("Aplicación creada", {
      adminId: req.user.id,
      adminUsername: req.user.username,
      applicationId: application.id,
      applicationName: application.name,
      ip: req.ip,
    })

    res.status(201).json({
      message: "Aplicación creada exitosamente",
      application,
    })
  } catch (error) {
    logger.error("Error creando aplicación:", error)
    throw error
  }
}

/**
 * Actualizar una aplicación (admin)
 */
const updateApplication = async (req, res) => {
  const { id } = req.params
  const updateData = req.body

  try {
    const application = await applicationService.updateApplication(id, updateData)

    // Registrar actualización de aplicación
    logger.audit("Aplicación actualizada", {
      adminId: req.user.id,
      adminUsername: req.user.username,
      applicationId: id,
      changes: Object.keys(updateData),
      ip: req.ip,
    })

    res.json({
      message: "Aplicación actualizada exitosamente",
      application,
    })
  } catch (error) {
    logger.error("Error actualizando aplicación:", error)
    throw error
  }
}

/**
 * Eliminar una aplicación (admin)
 */
const deleteApplication = async (req, res) => {
  const { id } = req.params

  try {
    await applicationService.deleteApplication(id)

    // Registrar eliminación de aplicación
    logger.audit("Aplicación eliminada", {
      adminId: req.user.id,
      adminUsername: req.user.username,
      applicationId: id,
      ip: req.ip,
    })

    res.json({ message: "Aplicación eliminada exitosamente" })
  } catch (error) {
    logger.error("Error eliminando aplicación:", error)
    throw error
  }
}

/**
 * Aprobar acceso de un usuario a una aplicación (admin)
 */
const approveUserAccess = async (req, res) => {
  const { id, userId } = req.params

  try {
    await applicationService.approveUserAccess(userId, id)

    // Registrar aprobación de acceso
    logger.audit("Acceso a aplicación aprobado", {
      adminId: req.user.id,
      adminUsername: req.user.username,
      targetUserId: userId,
      applicationId: id,
      ip: req.ip,
    })

    res.json({ message: "Acceso aprobado exitosamente" })
  } catch (error) {
    logger.error("Error aprobando acceso:", error)
    throw error
  }
}

/**
 * Revocar acceso de un usuario a una aplicación (admin)
 */
const revokeUserAccess = async (req, res) => {
  const { id, userId } = req.params

  try {
    await applicationService.revokeUserAccess(userId, id)

    // Registrar revocación de acceso
    logger.audit("Acceso a aplicación revocado", {
      adminId: req.user.id,
      adminUsername: req.user.username,
      targetUserId: userId,
      applicationId: id,
      ip: req.ip,
    })

    res.json({ message: "Acceso revocado exitosamente" })
  } catch (error) {
    logger.error("Error revocando acceso:", error)
    throw error
  }
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

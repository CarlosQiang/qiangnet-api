/**
 * Servicio de administración
 *
 * Este archivo contiene la lógica de negocio para las operaciones
 * de administración del sistema como estadísticas, gestión de roles, etc.
 */

const userModel = require("../models/userModel")
const applicationModel = require("../models/applicationModel")
const auditModel = require("../models/auditModel")
const { AppError } = require("../middleware/errorHandler")
const logger = require("../utils/logger")
const config = require("../config/server")

/**
 * Obtener estadísticas del dashboard
 */
const getDashboardStats = async () => {
  try {
    // Estadísticas de usuarios
    const userStats = await userModel.getStats()

    // Estadísticas de aplicaciones
    const applicationStats = await applicationModel.getStats()

    // Estadísticas de auditoría (últimos 30 días)
    const auditStats = await auditModel.getStats(30)

    // Información del sistema
    const systemInfo = {
      uptime: process.uptime(),
      nodeVersion: process.version,
      environment: config.env,
      memoryUsage: process.memoryUsage(),
    }

    return {
      users: userStats,
      applications: applicationStats,
      audit: auditStats,
      system: systemInfo,
    }
  } catch (error) {
    logger.error("Error obteniendo estadísticas del dashboard:", error)
    throw AppError.internal("Error obteniendo estadísticas")
  }
}

/**
 * Obtener logs de auditoría
 */
const getAuditLogs = async ({ page = 1, limit = 50, sortBy = "created_at", sortOrder = "desc" }) => {
  const offset = (page - 1) * limit

  try {
    const logs = await auditModel.findMany({
      limit,
      offset,
      sortBy,
      sortOrder,
    })

    const total = await auditModel.count()

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    logger.error("Error obteniendo logs de auditoría:", error)
    throw AppError.internal("Error obteniendo logs de auditoría")
  }
}

/**
 * Obtener lista de roles
 */
const getRoles = async () => {
  try {
    const roles = await userModel.findAllRoles()
    return roles
  } catch (error) {
    logger.error("Error obteniendo roles:", error)
    throw AppError.internal("Error obteniendo roles")
  }
}

/**
 * Crear nuevo rol
 */
const createRole = async (roleData) => {
  try {
    // Verificar si ya existe un rol con el mismo nombre
    const existingRole = await userModel.findRoleByName(roleData.name)
    if (existingRole) {
      throw AppError.conflict("Ya existe un rol con ese nombre")
    }

    const role = await userModel.createRole(roleData)
    return role
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    logger.error("Error creando rol:", error)
    throw AppError.internal("Error creando rol")
  }
}

/**
 * Actualizar rol
 */
const updateRole = async (roleId, updateData) => {
  try {
    const role = await userModel.findRoleById(roleId)
    if (!role) {
      throw AppError.notFound("Rol no encontrado")
    }

    // Si se está actualizando el nombre, verificar que no exista otro con el mismo nombre
    if (updateData.name && updateData.name !== role.name) {
      const existingRole = await userModel.findRoleByName(updateData.name)
      if (existingRole) {
        throw AppError.conflict("Ya existe un rol con ese nombre")
      }
    }

    const updatedRole = await userModel.updateRole(roleId, updateData)
    return updatedRole
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    logger.error("Error actualizando rol:", error)
    throw AppError.internal("Error actualizando rol")
  }
}

/**
 * Eliminar rol
 */
const deleteRole = async (roleId) => {
  try {
    const role = await userModel.findRoleById(roleId)
    if (!role) {
      throw AppError.notFound("Rol no encontrado")
    }

    // No permitir eliminar roles del sistema
    if (role.name === "admin" || role.name === "user") {
      throw AppError.badRequest("No se pueden eliminar roles del sistema")
    }

    // Verificar si hay usuarios con este rol
    const usersWithRole = await userModel.countUsersWithRole(roleId)
    if (usersWithRole > 0) {
      throw AppError.badRequest("No se puede eliminar un rol que está asignado a usuarios")
    }

    await userModel.deleteRole(roleId)
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    logger.error("Error eliminando rol:", error)
    throw AppError.internal("Error eliminando rol")
  }
}

/**
 * Asignar rol a usuario
 */
const assignRole = async (userId, roleId) => {
  try {
    // Verificar que el usuario existe
    const user = await userModel.findById(userId)
    if (!user) {
      throw AppError.notFound("Usuario no encontrado")
    }

    // Verificar que el rol existe
    const role = await userModel.findRoleById(roleId)
    if (!role) {
      throw AppError.notFound("Rol no encontrado")
    }

    // Verificar si ya tiene el rol asignado
    const existingAssignment = await userModel.findUserRole(userId, roleId)
    if (existingAssignment) {
      throw AppError.badRequest("El usuario ya tiene este rol asignado")
    }

    await userModel.assignRole(userId, roleId)
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    logger.error("Error asignando rol:", error)
    throw AppError.internal("Error asignando rol")
  }
}

/**
 * Remover rol de usuario
 */
const removeRole = async (userId, roleId) => {
  try {
    // Verificar que el usuario existe
    const user = await userModel.findById(userId)
    if (!user) {
      throw AppError.notFound("Usuario no encontrado")
    }

    // Verificar que el rol existe
    const role = await userModel.findRoleById(roleId)
    if (!role) {
      throw AppError.notFound("Rol no encontrado")
    }

    // Verificar que el usuario tiene el rol asignado
    const existingAssignment = await userModel.findUserRole(userId, roleId)
    if (!existingAssignment) {
      throw AppError.badRequest("El usuario no tiene este rol asignado")
    }

    // No permitir remover el último rol de admin
    if (role.name === "admin") {
      const adminCount = await userModel.countUsersWithRole(roleId)
      if (adminCount <= 1) {
        throw AppError.badRequest("No se puede remover el último administrador")
      }
    }

    await userModel.removeRole(userId, roleId)
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    logger.error("Error removiendo rol:", error)
    throw AppError.internal("Error removiendo rol")
  }
}

/**
 * Obtener información del sistema
 */
const getSystemInfo = async () => {
  try {
    const systemInfo = {
      application: {
        name: config.appName,
        version: config.appVersion,
        environment: config.env,
        uptime: process.uptime(),
      },
      server: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
      database: {
        // Aquí podrías añadir información de la base de datos
        connected: true, // Esto se podría verificar con una consulta real
      },
    }

    return systemInfo
  } catch (error) {
    logger.error("Error obteniendo información del sistema:", error)
    throw AppError.internal("Error obteniendo información del sistema")
  }
}

/**
 * Activar/desactivar modo mantenimiento
 */
const toggleMaintenance = async (enabled) => {
  try {
    // Aquí podrías implementar la lógica para activar/desactivar el modo mantenimiento
    // Por ejemplo, escribir a un archivo, actualizar una variable en la base de datos, etc.

    // Por ahora, solo lo registramos
    logger.info(`Modo mantenimiento ${enabled ? "activado" : "desactivado"}`)

    // En una implementación real, podrías:
    // - Actualizar una configuración en la base de datos
    // - Escribir a un archivo de configuración
    // - Actualizar una variable de entorno

    return { maintenanceMode: enabled }
  } catch (error) {
    logger.error("Error cambiando modo mantenimiento:", error)
    throw AppError.internal("Error cambiando modo mantenimiento")
  }
}

module.exports = {
  getDashboardStats,
  getAuditLogs,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  assignRole,
  removeRole,
  getSystemInfo,
  toggleMaintenance,
}

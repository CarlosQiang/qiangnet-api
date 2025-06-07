/**
 * Controlador de administración
 *
 * Este archivo contiene los controladores para manejar las operaciones
 * de administración del sistema como estadísticas, gestión de roles, etc.
 */

const adminService = require("../services/adminService")
const userService = require("../services/userService")
const { AppError } = require("../middleware/errorHandler")
const logger = require("../utils/logger")

/**
 * Obtener estadísticas del dashboard de administración
 */
const getDashboardStats = async (req, res) => {
  try {
    const stats = await adminService.getDashboardStats()

    res.json({ stats })
  } catch (error) {
    logger.error("Error obteniendo estadísticas del dashboard:", error)
    throw error
  }
}

/**
 * Obtener lista de usuarios para administración
 */
const getUsers = async (req, res) => {
  const { page, limit, sortBy, sortOrder } = req.query

  try {
    const result = await userService.getUsers({
      page: Number.parseInt(page) || 1,
      limit: Number.parseInt(limit) || 10,
      sortBy: sortBy || "created_at",
      sortOrder: sortOrder || "desc",
      includeStats: true, // Incluir estadísticas adicionales para admin
    })

    res.json(result)
  } catch (error) {
    logger.error("Error obteniendo usuarios para admin:", error)
    throw error
  }
}

/**
 * Obtener logs de auditoría
 */
const getAuditLogs = async (req, res) => {
  const { page, limit, sortBy, sortOrder } = req.query

  try {
    const result = await adminService.getAuditLogs({
      page: Number.parseInt(page) || 1,
      limit: Number.parseInt(limit) || 50,
      sortBy: sortBy || "created_at",
      sortOrder: sortOrder || "desc",
    })

    res.json(result)
  } catch (error) {
    logger.error("Error obteniendo logs de auditoría:", error)
    throw error
  }
}

/**
 * Obtener lista de roles
 */
const getRoles = async (req, res) => {
  try {
    const roles = await adminService.getRoles()

    res.json({ roles })
  } catch (error) {
    logger.error("Error obteniendo roles:", error)
    throw error
  }
}

/**
 * Crear un nuevo rol
 */
const createRole = async (req, res) => {
  const roleData = req.body

  try {
    const role = await adminService.createRole(roleData)

    // Registrar creación de rol
    logger.audit("Rol creado", {
      adminId: req.user.id,
      adminUsername: req.user.username,
      roleId: role.id,
      roleName: role.name,
      ip: req.ip,
    })

    res.status(201).json({
      message: "Rol creado exitosamente",
      role,
    })
  } catch (error) {
    logger.error("Error creando rol:", error)
    throw error
  }
}

/**
 * Actualizar un rol
 */
const updateRole = async (req, res) => {
  const { id } = req.params
  const updateData = req.body

  try {
    const role = await adminService.updateRole(id, updateData)

    // Registrar actualización de rol
    logger.audit("Rol actualizado", {
      adminId: req.user.id,
      adminUsername: req.user.username,
      roleId: id,
      changes: Object.keys(updateData),
      ip: req.ip,
    })

    res.json({
      message: "Rol actualizado exitosamente",
      role,
    })
  } catch (error) {
    logger.error("Error actualizando rol:", error)
    throw error
  }
}

/**
 * Eliminar un rol
 */
const deleteRole = async (req, res) => {
  const { id } = req.params

  try {
    await adminService.deleteRole(id)

    // Registrar eliminación de rol
    logger.audit("Rol eliminado", {
      adminId: req.user.id,
      adminUsername: req.user.username,
      roleId: id,
      ip: req.ip,
    })

    res.json({ message: "Rol eliminado exitosamente" })
  } catch (error) {
    logger.error("Error eliminando rol:", error)
    throw error
  }
}

/**
 * Asignar rol a usuario
 */
const assignRole = async (req, res) => {
  const { userId, roleId } = req.params

  try {
    await adminService.assignRole(userId, roleId)

    // Registrar asignación de rol
    logger.audit("Rol asignado a usuario", {
      adminId: req.user.id,
      adminUsername: req.user.username,
      targetUserId: userId,
      roleId,
      ip: req.ip,
    })

    res.json({ message: "Rol asignado exitosamente" })
  } catch (error) {
    logger.error("Error asignando rol:", error)
    throw error
  }
}

/**
 * Remover rol de usuario
 */
const removeRole = async (req, res) => {
  const { userId, roleId } = req.params

  try {
    await adminService.removeRole(userId, roleId)

    // Registrar remoción de rol
    logger.audit("Rol removido de usuario", {
      adminId: req.user.id,
      adminUsername: req.user.username,
      targetUserId: userId,
      roleId,
      ip: req.ip,
    })

    res.json({ message: "Rol removido exitosamente" })
  } catch (error) {
    logger.error("Error removiendo rol:", error)
    throw error
  }
}

/**
 * Obtener información del sistema
 */
const getSystemInfo = async (req, res) => {
  try {
    const systemInfo = await adminService.getSystemInfo()

    res.json({ systemInfo })
  } catch (error) {
    logger.error("Error obteniendo información del sistema:", error)
    throw error
  }
}

/**
 * Activar/desactivar modo mantenimiento
 */
const toggleMaintenance = async (req, res) => {
  const { enabled } = req.body

  try {
    await adminService.toggleMaintenance(enabled)

    // Registrar cambio de modo mantenimiento
    logger.audit("Modo mantenimiento cambiado", {
      adminId: req.user.id,
      adminUsername: req.user.username,
      enabled,
      ip: req.ip,
    })

    res.json({
      message: `Modo mantenimiento ${enabled ? "activado" : "desactivado"} exitosamente`,
    })
  } catch (error) {
    logger.error("Error cambiando modo mantenimiento:", error)
    throw error
  }
}

module.exports = {
  getDashboardStats,
  getUsers,
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

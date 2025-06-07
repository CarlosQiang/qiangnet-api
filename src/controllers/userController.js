/**
 * Controlador de usuarios
 *
 * Este archivo contiene los controladores para manejar las operaciones
 * relacionadas con usuarios como obtener perfil, actualizar datos, etc.
 */

const userService = require("../services/userService")
const { AppError } = require("../middleware/errorHandler")
const logger = require("../utils/logger")

/**
 * Obtener perfil del usuario actual
 */
const getProfile = async (req, res) => {
  const userId = req.user.id

  try {
    const user = await userService.getUserById(userId)

    if (!user) {
      throw AppError.notFound("Usuario no encontrado")
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        isApproved: user.is_approved,
        isBlocked: user.is_blocked,
        roles: user.roles || [],
        createdAt: user.created_at,
        lastLogin: user.last_login,
      },
    })
  } catch (error) {
    logger.error("Error obteniendo perfil:", error)
    throw error
  }
}

/**
 * Actualizar perfil del usuario actual
 */
const updateProfile = async (req, res) => {
  const userId = req.user.id
  const updateData = req.body

  try {
    const updatedUser = await userService.updateUser(userId, updateData)

    // Registrar actualización de perfil
    logger.audit("Perfil actualizado", {
      userId,
      username: req.user.username,
      changes: Object.keys(updateData),
      ip: req.ip,
    })

    res.json({
      message: "Perfil actualizado exitosamente",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
        updatedAt: updatedUser.updated_at,
      },
    })
  } catch (error) {
    logger.error("Error actualizando perfil:", error)
    throw error
  }
}

/**
 * Obtener un usuario por ID (admin)
 */
const getUserById = async (req, res) => {
  const { id } = req.params

  try {
    const user = await userService.getUserById(id)

    if (!user) {
      throw AppError.notFound("Usuario no encontrado")
    }

    res.json({ user })
  } catch (error) {
    logger.error("Error obteniendo usuario por ID:", error)
    throw error
  }
}

/**
 * Obtener lista de usuarios (admin)
 */
const getUsers = async (req, res) => {
  const { page, limit, sortBy, sortOrder } = req.query

  try {
    const result = await userService.getUsers({
      page: Number.parseInt(page) || 1,
      limit: Number.parseInt(limit) || 10,
      sortBy: sortBy || "created_at",
      sortOrder: sortOrder || "desc",
    })

    res.json(result)
  } catch (error) {
    logger.error("Error obteniendo lista de usuarios:", error)
    throw error
  }
}

/**
 * Actualizar un usuario por ID (admin)
 */
const updateUser = async (req, res) => {
  const { id } = req.params
  const updateData = req.body

  try {
    const updatedUser = await userService.updateUser(id, updateData)

    // Registrar actualización por admin
    logger.audit("Usuario actualizado por admin", {
      adminId: req.user.id,
      adminUsername: req.user.username,
      targetUserId: id,
      changes: Object.keys(updateData),
      ip: req.ip,
    })

    res.json({
      message: "Usuario actualizado exitosamente",
      user: updatedUser,
    })
  } catch (error) {
    logger.error("Error actualizando usuario:", error)
    throw error
  }
}

/**
 * Eliminar un usuario por ID (admin)
 */
const deleteUser = async (req, res) => {
  const { id } = req.params

  try {
    await userService.deleteUser(id)

    // Registrar eliminación por admin
    logger.audit("Usuario eliminado por admin", {
      adminId: req.user.id,
      adminUsername: req.user.username,
      targetUserId: id,
      ip: req.ip,
    })

    res.json({ message: "Usuario eliminado exitosamente" })
  } catch (error) {
    logger.error("Error eliminando usuario:", error)
    throw error
  }
}

/**
 * Aprobar un usuario (admin)
 */
const approveUser = async (req, res) => {
  const { id } = req.params

  try {
    const user = await userService.approveUser(id)

    // Registrar aprobación
    logger.audit("Usuario aprobado", {
      adminId: req.user.id,
      adminUsername: req.user.username,
      targetUserId: id,
      ip: req.ip,
    })

    res.json({
      message: "Usuario aprobado exitosamente",
      user,
    })
  } catch (error) {
    logger.error("Error aprobando usuario:", error)
    throw error
  }
}

/**
 * Bloquear un usuario (admin)
 */
const blockUser = async (req, res) => {
  const { id } = req.params

  try {
    const user = await userService.blockUser(id)

    // Registrar bloqueo
    logger.audit("Usuario bloqueado", {
      adminId: req.user.id,
      adminUsername: req.user.username,
      targetUserId: id,
      ip: req.ip,
    })

    res.json({
      message: "Usuario bloqueado exitosamente",
      user,
    })
  } catch (error) {
    logger.error("Error bloqueando usuario:", error)
    throw error
  }
}

/**
 * Desbloquear un usuario (admin)
 */
const unblockUser = async (req, res) => {
  const { id } = req.params

  try {
    const user = await userService.unblockUser(id)

    // Registrar desbloqueo
    logger.audit("Usuario desbloqueado", {
      adminId: req.user.id,
      adminUsername: req.user.username,
      targetUserId: id,
      ip: req.ip,
    })

    res.json({
      message: "Usuario desbloqueado exitosamente",
      user,
    })
  } catch (error) {
    logger.error("Error desbloqueando usuario:", error)
    throw error
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getUserById,
  getUsers,
  updateUser,
  deleteUser,
  approveUser,
  blockUser,
  unblockUser,
}

/**
 * Servicio de usuarios
 *
 * Este archivo contiene la lógica de negocio para las operaciones
 * relacionadas con usuarios como obtener, actualizar, eliminar, etc.
 */

const userModel = require("../models/userModel")
const { hashPassword } = require("../utils/encryption")
const { validatePassword, isValidEmail } = require("../utils/validators")
const { AppError } = require("../middleware/errorHandler")
const logger = require("../utils/logger")

/**
 * Obtener usuario por ID
 */
const getUserById = async (userId) => {
  const user = await userModel.findById(userId)

  if (!user) {
    return null
  }

  // Obtener roles del usuario
  const roles = await userModel.getUserRoles(userId)

  return {
    ...user,
    roles: roles.map((role) => role.name),
  }
}

/**
 * Obtener lista de usuarios con paginación
 */
const getUsers = async ({ page = 1, limit = 10, sortBy = "created_at", sortOrder = "desc", includeStats = false }) => {
  const offset = (page - 1) * limit

  // Obtener usuarios
  const users = await userModel.findMany({
    limit,
    offset,
    sortBy,
    sortOrder,
  })

  // Obtener total de usuarios para paginación
  const total = await userModel.count()

  // Obtener roles para cada usuario
  const usersWithRoles = await Promise.all(
    users.map(async (user) => {
      const roles = await userModel.getUserRoles(user.id)
      return {
        ...user,
        roles: roles.map((role) => role.name),
      }
    }),
  )

  const result = {
    users: usersWithRoles,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }

  // Incluir estadísticas adicionales si se solicita (para admin)
  if (includeStats) {
    const stats = await userModel.getStats()
    result.stats = stats
  }

  return result
}

/**
 * Actualizar usuario
 */
const updateUser = async (userId, updateData) => {
  const user = await userModel.findById(userId)

  if (!user) {
    throw AppError.notFound("Usuario no encontrado")
  }

  // Validar datos de actualización
  const validatedData = {}

  if (updateData.name !== undefined) {
    if (!updateData.name || updateData.name.trim().length === 0) {
      throw AppError.validation("El nombre no puede estar vacío")
    }
    validatedData.name = updateData.name.trim()
  }

  if (updateData.email !== undefined) {
    if (!isValidEmail(updateData.email)) {
      throw AppError.validation("Email inválido")
    }

    // Verificar si el email ya está en uso por otro usuario
    const existingUser = await userModel.findByEmail(updateData.email)
    if (existingUser && existingUser.id !== userId) {
      throw AppError.conflict("El email ya está en uso")
    }

    validatedData.email = updateData.email.toLowerCase()
  }

  if (updateData.password !== undefined) {
    // Validar nueva contraseña
    const passwordValidation = validatePassword(updateData.password)
    if (!passwordValidation.isValid) {
      throw AppError.validation("Contraseña inválida", passwordValidation.errors)
    }

    validatedData.password = await hashPassword(updateData.password)
  }

  // Campos que solo admin puede actualizar
  if (updateData.is_approved !== undefined) {
    validatedData.is_approved = Boolean(updateData.is_approved)
  }

  if (updateData.is_blocked !== undefined) {
    validatedData.is_blocked = Boolean(updateData.is_blocked)
  }

  // Actualizar usuario
  const updatedUser = await userModel.update(userId, validatedData)

  // Manejar actualización de roles si se proporciona
  if (updateData.roles !== undefined && Array.isArray(updateData.roles)) {
    await updateUserRoles(userId, updateData.roles)
  }

  return updatedUser
}

/**
 * Actualizar roles de usuario
 */
const updateUserRoles = async (userId, roleNames) => {
  // Obtener IDs de roles válidos
  const validRoles = await userModel.findRolesByNames(roleNames)
  const validRoleIds = validRoles.map((role) => role.id)

  // Eliminar roles actuales
  await userModel.removeAllUserRoles(userId)

  // Asignar nuevos roles
  for (const roleId of validRoleIds) {
    await userModel.assignRole(userId, roleId)
  }
}

/**
 * Eliminar usuario
 */
const deleteUser = async (userId) => {
  const user = await userModel.findById(userId)

  if (!user) {
    throw AppError.notFound("Usuario no encontrado")
  }

  // Eliminar usuario (esto también eliminará roles y refresh tokens por CASCADE)
  await userModel.delete(userId)
}

/**
 * Aprobar usuario
 */
const approveUser = async (userId) => {
  const user = await userModel.findById(userId)

  if (!user) {
    throw AppError.notFound("Usuario no encontrado")
  }

  if (user.is_approved) {
    throw AppError.badRequest("El usuario ya está aprobado")
  }

  const updatedUser = await userModel.update(userId, {
    is_approved: true,
    is_blocked: false, // Desbloquear al aprobar
  })

  return updatedUser
}

/**
 * Bloquear usuario
 */
const blockUser = async (userId) => {
  const user = await userModel.findById(userId)

  if (!user) {
    throw AppError.notFound("Usuario no encontrado")
  }

  if (user.is_blocked) {
    throw AppError.badRequest("El usuario ya está bloqueado")
  }

  const updatedUser = await userModel.update(userId, {
    is_blocked: true,
  })

  // Eliminar refresh tokens del usuario bloqueado
  await userModel.deleteUserRefreshTokens(userId)

  return updatedUser
}

/**
 * Desbloquear usuario
 */
const unblockUser = async (userId) => {
  const user = await userModel.findById(userId)

  if (!user) {
    throw AppError.notFound("Usuario no encontrado")
  }

  if (!user.is_blocked) {
    throw AppError.badRequest("El usuario no está bloqueado")
  }

  const updatedUser = await userModel.update(userId, {
    is_blocked: false,
    login_attempts: 0, // Resetear intentos de login
    locked_until: null, // Eliminar bloqueo temporal
  })

  return updatedUser
}

module.exports = {
  getUserById,
  getUsers,
  updateUser,
  updateUserRoles,
  deleteUser,
  approveUser,
  blockUser,
  unblockUser,
}

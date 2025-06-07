/**
 * Servicio de autenticación
 *
 * Este archivo contiene la lógica de negocio para las operaciones
 * de autenticación como login, registro, recuperación de contraseña, etc.
 */

const userModel = require("../models/userModel")
const { hashPassword, verifyPassword, generateRandomToken } = require("../utils/encryption")
const { generateToken, generateRefreshToken, verifyToken } = require("../config/jwt")
const { validatePassword } = require("../utils/validators")
const { AppError } = require("../middleware/errorHandler")
const logger = require("../utils/logger")
const config = require("../config/server")

/**
 * Iniciar sesión
 */
const login = async (username, password, ip, userAgent) => {
  // Buscar usuario por username o email
  const user = await userModel.findByUsernameOrEmail(username)

  if (!user) {
    throw AppError.unauthorized("Credenciales inválidas")
  }

  // Verificar si el usuario está bloqueado
  if (user.is_blocked) {
    throw AppError.forbidden("Usuario bloqueado")
  }

  // Verificar si el usuario está aprobado
  if (!user.is_approved) {
    throw AppError.forbidden("Usuario pendiente de aprobación")
  }

  // Verificar contraseña
  const isValidPassword = await verifyPassword(password, user.password)

  if (!isValidPassword) {
    // Incrementar intentos fallidos
    await userModel.incrementLoginAttempts(user.id)

    // Verificar si debe ser bloqueado temporalmente
    const updatedUser = await userModel.findById(user.id)
    if (updatedUser.login_attempts >= config.maxLoginAttempts) {
      await userModel.lockUser(user.id, config.lockoutDuration)
      throw AppError.forbidden("Usuario bloqueado temporalmente por múltiples intentos fallidos")
    }

    throw AppError.unauthorized("Credenciales inválidas")
  }

  // Verificar si está bloqueado temporalmente
  if (user.locked_until && new Date() < user.locked_until) {
    throw AppError.forbidden("Usuario bloqueado temporalmente")
  }

  // Login exitoso - resetear intentos fallidos
  await userModel.resetLoginAttempts(user.id)
  await userModel.updateLastLogin(user.id)

  // Obtener roles del usuario
  const roles = await userModel.getUserRoles(user.id)

  // Generar tokens
  const tokenPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    roles: roles.map((role) => role.name),
  }

  const token = generateToken(tokenPayload)
  const refreshToken = generateRefreshToken(user.id)

  // Guardar refresh token
  await userModel.saveRefreshToken(user.id, refreshToken, ip, userAgent)

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      isApproved: user.is_approved,
      roles: roles.map((role) => role.name),
    },
    token,
    refreshToken,
  }
}

/**
 * Registrar nuevo usuario
 */
const register = async ({ username, email, password, name, ip }) => {
  // Validar contraseña
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    throw AppError.validation("Contraseña inválida", passwordValidation.errors)
  }

  // Verificar si el username ya existe
  const existingUsername = await userModel.findByUsername(username)
  if (existingUsername) {
    throw AppError.conflict("El nombre de usuario ya está en uso")
  }

  // Verificar si el email ya existe
  const existingEmail = await userModel.findByEmail(email)
  if (existingEmail) {
    throw AppError.conflict("El email ya está registrado")
  }

  // Hash de la contraseña
  const hashedPassword = await hashPassword(password)

  // Crear usuario
  const userData = {
    username,
    email,
    password: hashedPassword,
    name,
    is_approved: false, // Por defecto requiere aprobación
    registration_ip: ip,
  }

  const user = await userModel.create(userData)

  // Asignar rol de usuario por defecto
  const userRole = await userModel.findRoleByName("user")
  if (userRole) {
    await userModel.assignRole(user.id, userRole.id)
  }

  return user
}

/**
 * Refrescar token de acceso
 */
const refreshToken = async (refreshToken) => {
  // Verificar refresh token
  const payload = verifyToken(refreshToken)
  if (!payload || payload.type !== "refresh") {
    throw AppError.unauthorized("Refresh token inválido")
  }

  // Verificar si el refresh token existe en la base de datos
  const storedToken = await userModel.findRefreshToken(refreshToken)
  if (!storedToken) {
    throw AppError.unauthorized("Refresh token no encontrado")
  }

  // Verificar si el refresh token ha expirado
  if (new Date() > storedToken.expires_at) {
    await userModel.deleteRefreshToken(refreshToken)
    throw AppError.unauthorized("Refresh token expirado")
  }

  // Obtener usuario
  const user = await userModel.findById(payload.userId)
  if (!user || user.is_blocked || !user.is_approved) {
    throw AppError.unauthorized("Usuario no válido")
  }

  // Obtener roles del usuario
  const roles = await userModel.getUserRoles(user.id)

  // Generar nuevos tokens
  const tokenPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    roles: roles.map((role) => role.name),
  }

  const newToken = generateToken(tokenPayload)
  const newRefreshToken = generateRefreshToken(user.id)

  // Actualizar refresh token en la base de datos
  await userModel.updateRefreshToken(storedToken.id, newRefreshToken)

  return {
    token: newToken,
    refreshToken: newRefreshToken,
  }
}

/**
 * Cerrar sesión
 */
const logout = async (userId, token) => {
  // Eliminar refresh tokens del usuario
  await userModel.deleteUserRefreshTokens(userId)

  // Aquí podrías implementar una blacklist de tokens si es necesario
  // Por ahora, simplemente eliminamos los refresh tokens
}

/**
 * Solicitar recuperación de contraseña
 */
const forgotPassword = async (email, ip) => {
  const user = await userModel.findByEmail(email)

  if (!user) {
    // No revelar si el email existe o no
    return
  }

  // Generar token de recuperación
  const resetToken = generateRandomToken(32)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

  // Guardar token de recuperación
  await userModel.savePasswordResetToken(user.id, resetToken, expiresAt, ip)

  // Aquí enviarías el email con el token
  // Por ahora solo lo registramos en el log
  logger.info("Token de recuperación generado", {
    userId: user.id,
    email: user.email,
    token: resetToken,
    ip,
  })

  return resetToken // En producción, no devolver el token
}

/**
 * Restablecer contraseña con token
 */
const resetPassword = async (token, newPassword, ip) => {
  // Validar nueva contraseña
  const passwordValidation = validatePassword(newPassword)
  if (!passwordValidation.isValid) {
    throw AppError.validation("Contraseña inválida", passwordValidation.errors)
  }

  // Buscar token de recuperación
  const resetToken = await userModel.findPasswordResetToken(token)

  if (!resetToken) {
    throw AppError.badRequest("Token de recuperación inválido")
  }

  // Verificar si el token ha expirado
  if (new Date() > resetToken.expires_at) {
    await userModel.deletePasswordResetToken(token)
    throw AppError.badRequest("Token de recuperación expirado")
  }

  // Hash de la nueva contraseña
  const hashedPassword = await hashPassword(newPassword)

  // Actualizar contraseña
  await userModel.updatePassword(resetToken.user_id, hashedPassword)

  // Eliminar token de recuperación
  await userModel.deletePasswordResetToken(token)

  // Eliminar todos los refresh tokens del usuario por seguridad
  await userModel.deleteUserRefreshTokens(resetToken.user_id)
}

/**
 * Cambiar contraseña (usuario autenticado)
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  // Obtener usuario
  const user = await userModel.findById(userId)
  if (!user) {
    throw AppError.notFound("Usuario no encontrado")
  }

  // Verificar contraseña actual
  const isValidPassword = await verifyPassword(currentPassword, user.password)
  if (!isValidPassword) {
    throw AppError.unauthorized("Contraseña actual incorrecta")
  }

  // Validar nueva contraseña
  const passwordValidation = validatePassword(newPassword)
  if (!passwordValidation.isValid) {
    throw AppError.validation("Nueva contraseña inválida", passwordValidation.errors)
  }

  // Hash de la nueva contraseña
  const hashedPassword = await hashPassword(newPassword)

  // Actualizar contraseña
  await userModel.updatePassword(userId, hashedPassword)

  // Eliminar todos los refresh tokens del usuario por seguridad
  await userModel.deleteUserRefreshTokens(userId)
}

module.exports = {
  login,
  register,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
}

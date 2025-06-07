/**
 * Controlador de autenticación
 *
 * Este archivo contiene los controladores para manejar las operaciones
 * de autenticación como login, registro, recuperación de contraseña, etc.
 */

const authService = require("../services/authService")
const userService = require("../services/userService")
const { AppError } = require("../middleware/errorHandler")
const logger = require("../utils/logger")

/**
 * Iniciar sesión
 */
const login = async (req, res) => {
  const { username, password } = req.body
  const ip = req.ip
  const userAgent = req.headers["user-agent"]

  try {
    const result = await authService.login(username, password, ip, userAgent)

    // Registrar login exitoso
    logger.audit("Login exitoso", {
      userId: result.user.id,
      username: result.user.username,
      ip,
    })

    res.json({
      message: "Login exitoso",
      user: result.user,
      token: result.token,
      refreshToken: result.refreshToken,
    })
  } catch (error) {
    // Registrar intento de login fallido
    logger.security("Intento de login fallido", {
      username,
      ip,
      error: error.message,
    })

    throw error
  }
}

/**
 * Registrar nuevo usuario
 */
const register = async (req, res) => {
  const { username, email, password, name } = req.body
  const ip = req.ip

  try {
    const user = await authService.register({
      username,
      email,
      password,
      name,
      ip,
    })

    // Registrar registro exitoso
    logger.audit("Usuario registrado", {
      userId: user.id,
      username: user.username,
      email: user.email,
      ip,
    })

    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        isApproved: user.is_approved,
      },
    })
  } catch (error) {
    // Registrar intento de registro fallido
    logger.security("Intento de registro fallido", {
      username,
      email,
      ip,
      error: error.message,
    })

    throw error
  }
}

/**
 * Refrescar token de acceso
 */
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body

  try {
    const result = await authService.refreshToken(refreshToken)

    res.json({
      message: "Token refrescado exitosamente",
      token: result.token,
      refreshToken: result.refreshToken,
    })
  } catch (error) {
    logger.security("Intento de refresh token fallido", {
      ip: req.ip,
      error: error.message,
    })

    throw error
  }
}

/**
 * Cerrar sesión
 */
const logout = async (req, res) => {
  const userId = req.user.id
  const token = req.headers.authorization?.split(" ")[1]

  try {
    await authService.logout(userId, token)

    // Registrar logout
    logger.audit("Logout exitoso", {
      userId,
      username: req.user.username,
      ip: req.ip,
    })

    res.json({ message: "Logout exitoso" })
  } catch (error) {
    logger.error("Error en logout:", error)
    throw error
  }
}

/**
 * Solicitar recuperación de contraseña
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body
  const ip = req.ip

  try {
    await authService.forgotPassword(email, ip)

    // Siempre responder con éxito para no revelar si el email existe
    res.json({
      message: "Si el email existe, recibirás instrucciones para restablecer tu contraseña",
    })
  } catch (error) {
    logger.error("Error en forgot password:", error)
    // Siempre responder con éxito para no revelar errores internos
    res.json({
      message: "Si el email existe, recibirás instrucciones para restablecer tu contraseña",
    })
  }
}

/**
 * Restablecer contraseña con token
 */
const resetPassword = async (req, res) => {
  const { token, password } = req.body
  const ip = req.ip

  try {
    await authService.resetPassword(token, password, ip)

    res.json({ message: "Contraseña restablecida exitosamente" })
  } catch (error) {
    logger.security("Intento de reset password fallido", {
      ip,
      error: error.message,
    })

    throw error
  }
}

/**
 * Cambiar contraseña (usuario autenticado)
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const userId = req.user.id

  try {
    await authService.changePassword(userId, currentPassword, newPassword)

    // Registrar cambio de contraseña
    logger.audit("Contraseña cambiada", {
      userId,
      username: req.user.username,
      ip: req.ip,
    })

    res.json({ message: "Contraseña cambiada exitosamente" })
  } catch (error) {
    logger.security("Intento de cambio de contraseña fallido", {
      userId,
      username: req.user.username,
      ip: req.ip,
      error: error.message,
    })

    throw error
  }
}

/**
 * Obtener información del usuario actual
 */
const getCurrentUser = async (req, res) => {
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
    logger.error("Error obteniendo usuario actual:", error)
    throw error
  }
}

module.exports = {
  login,
  register,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  getCurrentUser,
}

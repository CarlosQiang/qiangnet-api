/**
 * Middleware de autenticación
 *
 * Este archivo contiene middleware para verificar la autenticación
 * y autorización de usuarios en las rutas protegidas.
 */

const jwt = require("../config/jwt")
const logger = require("../utils/logger")
const userService = require("../services/userService")

/**
 * Middleware para verificar si el usuario está autenticado
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar al siguiente middleware
 */
const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No autenticado" })
    }

    const token = authHeader.split(" ")[1]

    // Verificar token
    const payload = jwt.verifyToken(token)
    if (!payload) {
      return res.status(401).json({ error: "Token inválido o expirado" })
    }

    // Verificar si el usuario existe y está activo
    const user = await userService.getUserById(payload.userId)
    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" })
    }

    if (!user.is_approved) {
      return res.status(403).json({ error: "Usuario pendiente de aprobación" })
    }

    if (user.is_blocked) {
      return res.status(403).json({ error: "Usuario bloqueado" })
    }

    // Añadir información del usuario a la solicitud
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      roles: payload.roles || [],
    }

    // Registrar acceso en log de auditoría
    logger.audit("Acceso autenticado", {
      userId: user.id,
      username: user.username,
      endpoint: req.originalUrl,
      method: req.method,
      ip: req.ip,
    })

    next()
  } catch (error) {
    logger.error("Error en middleware de autenticación:", error)
    return res.status(500).json({ error: "Error interno del servidor" })
  }
}

/**
 * Middleware para verificar si el usuario tiene un rol específico
 * @param {string|string[]} requiredRoles - Rol o roles requeridos
 * @returns {Function} Middleware de Express
 */
const authorize = (requiredRoles) => {
  return (req, res, next) => {
    try {
      // Verificar si el usuario está autenticado
      if (!req.user) {
        return res.status(401).json({ error: "No autenticado" })
      }

      const userRoles = req.user.roles || []

      // Convertir a array si es un solo rol
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]

      // Verificar si el usuario tiene alguno de los roles requeridos
      const hasRequiredRole = roles.some((role) => userRoles.includes(role))

      if (!hasRequiredRole) {
        // Registrar intento de acceso no autorizado
        logger.security("Intento de acceso no autorizado", {
          userId: req.user.id,
          username: req.user.username,
          endpoint: req.originalUrl,
          method: req.method,
          requiredRoles: roles,
          userRoles,
        })

        return res.status(403).json({ error: "No autorizado" })
      }

      next()
    } catch (error) {
      logger.error("Error en middleware de autorización:", error)
      return res.status(500).json({ error: "Error interno del servidor" })
    }
  }
}

/**
 * Middleware opcional que añade información del usuario si está autenticado
 * pero no bloquea la solicitud si no lo está
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar al siguiente middleware
 */
const optionalAuth = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Continuar sin autenticación
      return next()
    }

    const token = authHeader.split(" ")[1]

    // Verificar token
    const payload = jwt.verifyToken(token)
    if (!payload) {
      // Continuar sin autenticación
      return next()
    }

    // Verificar si el usuario existe
    const user = await userService.getUserById(payload.userId)
    if (user && !user.is_blocked) {
      // Añadir información del usuario a la solicitud
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: payload.roles || [],
      }
    }

    next()
  } catch (error) {
    // En caso de error, continuar sin autenticación
    logger.debug("Error en middleware de autenticación opcional:", error)
    next()
  }
}

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
}

/**
 * Middleware de rate limiting
 *
 * Este archivo contiene middleware para limitar la tasa de solicitudes
 * a endpoints específicos, protegiendo contra ataques de fuerza bruta.
 */

const { rateLimit } = require("express-rate-limit")
const logger = require("../utils/logger")
const config = require("../config/server")

/**
 * Crea un middleware de rate limiting con configuración personalizada
 * @param {Object} options - Opciones de configuración
 * @returns {Function} Middleware de Express
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMaxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Demasiadas solicitudes, por favor intente más tarde" },
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
      // Usar IP + User-Agent como clave para mayor seguridad
      return `${req.ip}-${req.headers["user-agent"] || "unknown"}`
    },
    handler: (req, res, next, options) => {
      // Registrar intento de exceso de tasa
      logger.security("Rate limit excedido", {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        endpoint: req.originalUrl,
        method: req.method,
        remaining: req.rateLimit?.remaining || 0,
        limit: req.rateLimit?.limit || options.max,
      })

      res.status(429).json(options.message)
    },
  }

  return rateLimit({ ...defaultOptions, ...options })
}

/**
 * Rate limiter para rutas de autenticación (más estricto)
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos por ventana
  message: { error: "Demasiados intentos de autenticación, por favor intente más tarde" },
})

/**
 * Rate limiter para rutas de registro (más estricto)
 */
const registerLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 intentos por ventana
  message: { error: "Demasiados intentos de registro, por favor intente más tarde" },
})

/**
 * Rate limiter para rutas de API general (menos estricto)
 */
const apiLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 100, // 100 intentos por ventana
})

/**
 * Rate limiter para rutas sensibles (moderadamente estricto)
 */
const sensitiveLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 30, // 30 intentos por ventana
})

module.exports = {
  createRateLimiter,
  authLimiter,
  registerLimiter,
  apiLimiter,
  sensitiveLimiter,
}

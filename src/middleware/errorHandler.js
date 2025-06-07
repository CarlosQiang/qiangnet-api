/**
 * Middleware de manejo de errores
 *
 * Este archivo contiene middleware para manejar errores de forma centralizada
 * y proporcionar respuestas consistentes a los clientes.
 */

const logger = require("../utils/logger")
const config = require("../config/server")

/**
 * Middleware para manejar errores
 * @param {Error} err - Error capturado
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar al siguiente middleware
 */
const errorHandler = (err, req, res, next) => {
  // Determinar el código de estado HTTP
  const statusCode = err.statusCode || 500

  // Determinar el mensaje de error
  let errorMessage = "Error interno del servidor"

  // En desarrollo, mostrar el mensaje de error real
  if (config.isDev) {
    errorMessage = err.message || errorMessage
  } else if (statusCode < 500) {
    // En producción, mostrar mensajes de error de cliente
    errorMessage = err.message || "Error en la solicitud"
  }

  // Registrar el error
  if (statusCode >= 500) {
    logger.error(`Error ${statusCode}: ${err.message}`, {
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
    })
  } else {
    logger.warn(`Error ${statusCode}: ${err.message}`, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
    })
  }

  // Construir respuesta de error
  const errorResponse = {
    error: errorMessage,
  }

  // En desarrollo, incluir detalles adicionales
  if (config.isDev) {
    errorResponse.stack = err.stack
    errorResponse.details = err.details || undefined
  }

  // Enviar respuesta
  res.status(statusCode).json(errorResponse)
}

/**
 * Middleware para manejar rutas no encontradas
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const notFoundHandler = (req, res) => {
  logger.debug(`Ruta no encontrada: ${req.originalUrl}`)
  res.status(404).json({ error: "Ruta no encontrada" })
}

/**
 * Clase para crear errores con código de estado HTTP
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message)
    this.statusCode = statusCode
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(message, details = null) {
    return new AppError(message || "Solicitud incorrecta", 400, details)
  }

  static unauthorized(message, details = null) {
    return new AppError(message || "No autenticado", 401, details)
  }

  static forbidden(message, details = null) {
    return new AppError(message || "No autorizado", 403, details)
  }

  static notFound(message, details = null) {
    return new AppError(message || "Recurso no encontrado", 404, details)
  }

  static conflict(message, details = null) {
    return new AppError(message || "Conflicto con el estado actual", 409, details)
  }

  static validation(message, details = null) {
    return new AppError(message || "Error de validación", 422, details)
  }

  static internal(message, details = null) {
    return new AppError(message || "Error interno del servidor", 500, details)
  }
}

/**
 * Middleware para capturar errores asíncronos
 * @param {Function} fn - Función asíncrona a envolver
 * @returns {Function} Middleware de Express
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  AppError,
  asyncHandler,
}

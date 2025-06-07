/**
 * Middleware de validación
 *
 * Este archivo contiene middleware para validar datos de entrada
 * utilizando express-validator y Joi.
 */

const { validationResult } = require("express-validator")
const Joi = require("joi")
const { AppError } = require("./errorHandler")
const logger = require("../utils/logger")

/**
 * Middleware para validar resultados de express-validator
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar al siguiente middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => ({
      field: error.param,
      message: error.msg,
    }))

    logger.debug("Error de validación:", { errors: errorMessages, path: req.path })

    return res.status(422).json({
      error: "Error de validación",
      details: errorMessages,
    })
  }

  next()
}

/**
 * Crea un middleware de validación usando Joi
 * @param {Object} schema - Esquema Joi para validar
 * @param {string} property - Propiedad de la solicitud a validar ('body', 'query', 'params')
 * @returns {Function} Middleware de Express
 */
const validateSchema = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const errorMessages = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }))

      logger.debug("Error de validación Joi:", { errors: errorMessages, path: req.path })

      return res.status(422).json({
        error: "Error de validación",
        details: errorMessages,
      })
    }

    // Reemplazar los datos validados
    req[property] = value
    next()
  }
}

/**
 * Esquemas Joi comunes para reutilizar
 */
const schemas = {
  // Esquema para ID
  id: Joi.object({
    id: Joi.string().uuid().required(),
  }),

  // Esquema para login
  login: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(8).required(),
  }),

  // Esquema para registro
  register: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().max(100).required(),
  }),

  // Esquema para actualización de usuario
  updateUser: Joi.object({
    name: Joi.string().max(100),
    email: Joi.string().email(),
    password: Joi.string().min(8).optional(),
    currentPassword: Joi.string().when("password", {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }).min(1), // Al menos un campo debe estar presente

  // Esquema para paginación
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid("asc", "desc").default("asc"),
  }),
}

module.exports = {
  validate,
  validateSchema,
  schemas,
}

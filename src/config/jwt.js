/**
 * Configuración y utilidades para JWT
 *
 * Este archivo contiene funciones para generar y verificar tokens JWT
 * utilizados en la autenticación de la API.
 */

const jwt = require("jsonwebtoken")
const logger = require("../utils/logger")
const config = require("./server")

/**
 * Genera un token JWT para un usuario
 * @param {Object} payload - Datos a incluir en el token
 * @param {string} [expiresIn] - Tiempo de expiración (opcional, usa el valor por defecto si no se proporciona)
 * @returns {string} Token JWT generado
 */
const generateToken = (payload, expiresIn = config.jwtExpiresIn) => {
  try {
    return jwt.sign(payload, config.jwtSecret, { expiresIn })
  } catch (error) {
    logger.error("Error al generar token JWT:", error)
    throw new Error("Error al generar token de autenticación")
  }
}

/**
 * Genera un token de actualización (refresh token)
 * @param {string} userId - ID del usuario
 * @returns {string} Refresh token generado
 */
const generateRefreshToken = (userId) => {
  try {
    return jwt.sign({ userId, type: "refresh" }, config.jwtSecret, {
      expiresIn: config.jwtRefreshExpiresIn,
    })
  } catch (error) {
    logger.error("Error al generar refresh token:", error)
    throw new Error("Error al generar token de actualización")
  }
}

/**
 * Verifica un token JWT
 * @param {string} token - Token JWT a verificar
 * @returns {Object|null} Payload decodificado o null si es inválido
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret)
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      logger.debug("Token JWT expirado")
      return null
    }

    logger.debug("Error al verificar token JWT:", error.message)
    return null
  }
}

/**
 * Decodifica un token JWT sin verificar su validez
 * @param {string} token - Token JWT a decodificar
 * @returns {Object|null} Payload decodificado o null si hay error
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token)
  } catch (error) {
    logger.debug("Error al decodificar token JWT:", error.message)
    return null
  }
}

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
}

/**
 * Utilidades de validación
 *
 * Este archivo proporciona funciones para validar diferentes tipos de datos
 * como emails, contraseñas, nombres de usuario, etc.
 */

const config = require("../config/server")

/**
 * Valida un email
 * @param {string} email - Email a validar
 * @returns {boolean} - true si es válido, false si no
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false

  // Expresión regular para validar emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida una contraseña según los requisitos configurados
 * @param {string} password - Contraseña a validar
 * @returns {Object} - Objeto con resultado de validación y errores
 */
const validatePassword = (password) => {
  const errors = []

  if (!password) {
    errors.push("La contraseña es requerida")
    return { isValid: false, errors }
  }

  // Verificar longitud mínima
  if (password.length < config.passwordMinLength) {
    errors.push(`La contraseña debe tener al menos ${config.passwordMinLength} caracteres`)
  }

  // Verificar requisitos de caracteres
  if (config.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    errors.push("La contraseña debe contener al menos una letra mayúscula")
  }

  if (config.passwordRequireLowercase && !/[a-z]/.test(password)) {
    errors.push("La contraseña debe contener al menos una letra minúscula")
  }

  if (config.passwordRequireNumbers && !/\d/.test(password)) {
    errors.push("La contraseña debe contener al menos un número")
  }

  if (config.passwordRequireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("La contraseña debe contener al menos un símbolo")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Valida un nombre de usuario
 * @param {string} username - Nombre de usuario a validar
 * @returns {boolean} - true si es válido, false si no
 */
const isValidUsername = (username) => {
  if (!username || typeof username !== "string") return false

  // Solo letras, números, guiones y guiones bajos, entre 3 y 30 caracteres
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/
  return usernameRegex.test(username)
}

/**
 * Sanitiza una cadena para prevenir inyecciones
 * @param {string} input - Cadena a sanitizar
 * @returns {string} - Cadena sanitizada
 */
const sanitizeString = (input) => {
  if (!input || typeof input !== "string") return ""

  // Eliminar caracteres potencialmente peligrosos
  return input
    .trim()
    .replace(/[<>]/g, "") // Eliminar < y >
    .replace(/javascript:/gi, "") // Eliminar javascript:
    .replace(/on\w+=/gi, "") // Eliminar eventos on*=
}

/**
 * Valida un UUID
 * @param {string} uuid - UUID a validar
 * @returns {boolean} - true si es válido, false si no
 */
const isValidUUID = (uuid) => {
  if (!uuid || typeof uuid !== "string") return false

  // Expresión regular para validar UUIDs
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Valida una URL
 * @param {string} url - URL a validar
 * @returns {boolean} - true si es válida, false si no
 */
const isValidURL = (url) => {
  if (!url || typeof url !== "string") return false

  try {
    new URL(url)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Valida una dirección IP
 * @param {string} ip - IP a validar
 * @returns {boolean} - true si es válida, false si no
 */
const isValidIP = (ip) => {
  if (!ip || typeof ip !== "string") return false

  // Expresión regular para validar IPv4 e IPv6
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  const ipv6Regex = /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i

  if (ipv4Regex.test(ip)) {
    // Verificar que cada octeto esté entre 0 y 255
    const octets = ip.split(".")
    return octets.every((octet) => Number.parseInt(octet) <= 255)
  }

  return ipv6Regex.test(ip)
}

module.exports = {
  isValidEmail,
  validatePassword,
  isValidUsername,
  sanitizeString,
  isValidUUID,
  isValidURL,
  isValidIP,
}

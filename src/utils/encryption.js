/**
 * Utilidades de encriptación y hashing
 *
 * Este archivo proporciona funciones para encriptar y desencriptar datos,
 * así como para generar y verificar hashes de contraseñas.
 */

const crypto = require("crypto")
const bcrypt = require("bcryptjs")
const config = require("../config/server")
const logger = require("./logger")

// Algoritmo de encriptación
const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16 // Para AES, esto es siempre 16 bytes
const SALT_ROUNDS = 12 // Para bcrypt

/**
 * Encripta un texto usando AES-256-GCM
 * @param {string} text - Texto a encriptar
 * @returns {string} - Texto encriptado en formato hex
 */
const encrypt = (text) => {
  try {
    if (!text) return ""

    // Generar IV aleatorio
    const iv = crypto.randomBytes(IV_LENGTH)

    // Crear cipher con la clave y el IV
    const key = Buffer.from(config.encryptionKey.slice(0, 32), "utf8")
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Encriptar el texto
    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")

    // Obtener el tag de autenticación
    const authTag = cipher.getAuthTag()

    // Combinar IV, texto encriptado y tag de autenticación
    return iv.toString("hex") + ":" + encrypted + ":" + authTag.toString("hex")
  } catch (error) {
    logger.error("Error al encriptar datos:", error)
    throw new Error("Error al encriptar datos")
  }
}

/**
 * Desencripta un texto encriptado con AES-256-GCM
 * @param {string} encryptedText - Texto encriptado en formato hex
 * @returns {string} - Texto desencriptado
 */
const decrypt = (encryptedText) => {
  try {
    if (!encryptedText) return ""

    // Separar IV, texto encriptado y tag de autenticación
    const parts = encryptedText.split(":")
    if (parts.length !== 3) {
      throw new Error("Formato de texto encriptado inválido")
    }

    const iv = Buffer.from(parts[0], "hex")
    const encrypted = parts[1]
    const authTag = Buffer.from(parts[2], "hex")

    // Crear decipher con la clave y el IV
    const key = Buffer.from(config.encryptionKey.slice(0, 32), "utf8")
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

    // Establecer el tag de autenticación
    decipher.setAuthTag(authTag)

    // Desencriptar el texto
    let decrypted = decipher.update(encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    logger.error("Error al desencriptar datos:", error)
    throw new Error("Error al desencriptar datos")
  }
}

/**
 * Genera un hash de una contraseña usando bcrypt
 * @param {string} password - Contraseña a hashear
 * @returns {Promise<string>} - Hash de la contraseña
 */
const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS)
  } catch (error) {
    logger.error("Error al generar hash de contraseña:", error)
    throw new Error("Error al procesar contraseña")
  }
}

/**
 * Verifica si una contraseña coincide con un hash
 * @param {string} password - Contraseña a verificar
 * @param {string} hash - Hash con el que comparar
 * @returns {Promise<boolean>} - true si coincide, false si no
 */
const verifyPassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    logger.error("Error al verificar contraseña:", error)
    throw new Error("Error al verificar contraseña")
  }
}

/**
 * Genera un token aleatorio seguro
 * @param {number} length - Longitud del token en bytes
 * @returns {string} - Token en formato hexadecimal
 */
const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex")
}

/**
 * Genera un hash SHA-256 de un texto
 * @param {string} text - Texto a hashear
 * @returns {string} - Hash en formato hexadecimal
 */
const sha256 = (text) => {
  return crypto.createHash("sha256").update(text).digest("hex")
}

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  generateRandomToken,
  sha256,
}

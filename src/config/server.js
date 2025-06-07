/**
 * Configuración del servidor
 *
 * Este archivo contiene la configuración general del servidor
 * y exporta valores que se utilizan en toda la aplicación.
 */

require("dotenv").config()

// Configuración del entorno
const config = {
  // Entorno de ejecución
  env: process.env.NODE_ENV || "development",
  isDev: process.env.NODE_ENV !== "production",
  isProd: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",

  // Servidor
  port: Number.parseInt(process.env.PORT) || 3001,
  host: process.env.HOST || "localhost",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  // Seguridad
  corsOrigins: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : ["http://localhost:3000"],
  rateLimitWindowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  rateLimitMaxRequests: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  // Logging
  logLevel: process.env.LOG_LEVEL || "info",
  logToFile: process.env.LOG_TO_FILE === "true",
  logDirectory: process.env.LOG_DIRECTORY || "../logs",

  // Autenticación
  jwtSecret: process.env.JWT_SECRET || "default_secret_key_change_in_production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // Encriptación
  encryptionKey: process.env.ENCRYPTION_KEY || "default_encryption_key_32_chars_min",

  // Email
  emailEnabled: process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS,
  emailHost: process.env.EMAIL_HOST,
  emailPort: Number.parseInt(process.env.EMAIL_PORT) || 587,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  emailFrom: process.env.EMAIL_FROM || "noreply@qiangnet.dev",

  // Configuración de la aplicación
  appName: "QiangNet API",
  appVersion: process.env.npm_package_version || "1.0.0",

  // Límites
  maxUploadSize: "1mb",
  sessionTimeout: Number.parseInt(process.env.SESSION_TIMEOUT) || 24 * 60 * 60 * 1000, // 24 horas

  // Configuración de seguridad
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireLowercase: true,
  passwordRequireNumbers: true,
  passwordRequireSymbols: false,
  maxLoginAttempts: 5,
  lockoutDuration: 30 * 60 * 1000, // 30 minutos
}

module.exports = config

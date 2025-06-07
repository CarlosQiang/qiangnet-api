/**
 * Configuración del sistema de logging
 *
 * Este archivo configura Winston para proporcionar logs estructurados
 * con diferentes niveles y formatos según el entorno.
 */

const winston = require("winston")
const path = require("path")
const fs = require("fs")
const config = require("../config/server")

// Crear directorio de logs si no existe
const logDir = path.join(__dirname, "../../logs")
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

// Formato para logs de desarrollo (coloridos y legibles)
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize(),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
)

// Formato para logs de producción (JSON estructurado)
const productionFormat = winston.format.combine(winston.format.timestamp(), winston.format.json())

// Configurar transports según el entorno
const transports = [
  // Siempre loguear a consola
  new winston.transports.Console({
    level: config.isDev ? "debug" : "info",
  }),
]

// Añadir transports de archivo si está habilitado
if (config.logToFile || config.isProd) {
  // Log de errores
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  )

  // Log combinado
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      level: config.logLevel,
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  )
}

// Crear logger
const logger = winston.createLogger({
  level: config.logLevel,
  format: config.isProd ? productionFormat : developmentFormat,
  transports,
  // No terminar el proceso en caso de error no manejado
  exitOnError: false,
})

// Añadir métodos de conveniencia para logging de seguridad y auditoría
logger.security = (message, metadata) => {
  logger.warn(`[SECURITY] ${message}`, metadata)
}

logger.audit = (message, metadata) => {
  logger.info(`[AUDIT] ${message}`, metadata)
}

// Exportar logger
module.exports = logger

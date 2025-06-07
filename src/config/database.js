/**
 * Configuración de la base de datos PostgreSQL
 *
 * Este archivo configura la conexión a la base de datos PostgreSQL
 * utilizando pg-pool para gestionar conexiones eficientemente.
 */

const { Pool } = require("pg")
const logger = require("../utils/logger")

// Configuración de la conexión a la base de datos
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number.parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "qiangnet_db",
  user: process.env.DB_USER || "qiangnet_admin",
  password: process.env.DB_PASSWORD || "password",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  max: Number.parseInt(process.env.DB_POOL_MAX) || 20, // Máximo de conexiones en el pool
  idleTimeoutMillis: Number.parseInt(process.env.DB_IDLE_TIMEOUT) || 30000, // Tiempo máximo de inactividad
  connectionTimeoutMillis: Number.parseInt(process.env.DB_CONNECTION_TIMEOUT) || 2000, // Tiempo máximo para conectar
})

// Eventos del pool
pool.on("connect", () => {
  logger.debug("Nueva conexión a la base de datos establecida")
})

pool.on("error", (err) => {
  logger.error("Error en la conexión a la base de datos:", err)
})

// Función para ejecutar consultas
const query = async (text, params) => {
  const start = Date.now()
  try {
    const result = await pool.query(text, params)
    const duration = Date.now() - start

    // Log para consultas lentas (más de 100ms)
    if (duration > 100) {
      logger.warn(`Consulta lenta (${duration}ms): ${text}`)
    } else {
      logger.debug(`Consulta ejecutada (${duration}ms): ${text}`)
    }

    return result
  } catch (error) {
    logger.error(`Error en consulta: ${text}`, error)
    throw error
  }
}

// Función para obtener una conexión del pool
const getClient = async () => {
  const client = await pool.connect()
  const query = client.query.bind(client)
  const release = client.release.bind(client)

  // Sobrescribir el método release para interceptar errores
  client.release = () => {
    release()
    logger.debug("Cliente de base de datos liberado al pool")
  }

  return {
    query,
    release: client.release,
    client,
  }
}

// Función para verificar la conexión a la base de datos
const checkConnection = async () => {
  try {
    const result = await query("SELECT NOW()")
    logger.info("Conexión a la base de datos verificada correctamente")
    return result.rows[0]
  } catch (error) {
    logger.error("Error al verificar la conexión a la base de datos:", error)
    throw error
  }
}

module.exports = {
  query,
  getClient,
  checkConnection,
  pool,
}

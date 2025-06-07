/**
 * Script para inicializar la base de datos
 *
 * Este script crea las tablas necesarias y datos iniciales
 * para el funcionamiento de la API.
 */

const fs = require("fs")
const path = require("path")
const { query, checkConnection } = require("../src/config/database")
const { hashPassword } = require("../src/utils/encryption")
const logger = require("../src/utils/logger")

async function initDatabase() {
  try {
    logger.info("Iniciando configuración de la base de datos...")

    // Verificar conexión
    await checkConnection()
    logger.info("✅ Conexión a la base de datos verificada")

    // Leer y ejecutar el esquema SQL
    const schemaPath = path.join(__dirname, "database-schema.sql")
    const schema = fs.readFileSync(schemaPath, "utf8")

    // Dividir el esquema en declaraciones individuales
    const statements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)

    logger.info("📝 Ejecutando esquema de base de datos...")
    for (const statement of statements) {
      try {
        await query(statement)
      } catch (error) {
        // Ignorar errores de "ya existe" pero reportar otros
        if (!error.message.includes("already exists") && !error.message.includes("duplicate key")) {
          logger.warn(`Advertencia ejecutando declaración: ${error.message}`)
        }
      }
    }

    logger.info("✅ Esquema de base de datos ejecutado")

    // Crear usuario administrador si no existe
    await createAdminUser()

    logger.info("🎉 Base de datos inicializada correctamente")
  } catch (error) {
    logger.error("❌ Error inicializando base de datos:", error)
    process.exit(1)
  }
}

async function createAdminUser() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@qiangnet.dev"
    const adminPassword = process.env.ADMIN_PASSWORD || "QiangNet2024!@#$SecureAdmin"

    // Verificar si ya existe un usuario admin
    const existingAdmin = await query("SELECT id FROM users WHERE email = $1", [adminEmail])

    if (existingAdmin.rows.length > 0) {
      logger.info("👤 Usuario administrador ya existe")
      return
    }

    // Obtener rol de admin
    const adminRole = await query("SELECT id FROM roles WHERE name = 'admin'")
    if (adminRole.rows.length === 0) {
      throw new Error("Rol de administrador no encontrado")
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(adminPassword)

    // Crear usuario administrador
    const adminUser = await query(
      `INSERT INTO users (username, email, password, name, is_approved, is_blocked)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      ["admin", adminEmail, hashedPassword, "Administrador", true, false],
    )

    // Asignar rol de admin
    await query("INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)", [
      adminUser.rows[0].id,
      adminRole.rows[0].id,
    ])

    logger.info("👤 Usuario administrador creado exitosamente")
    logger.info(`📧 Email: ${adminEmail}`)
    logger.info(`🔑 Contraseña: ${adminPassword}`)
    logger.warn("⚠️  IMPORTANTE: Cambia la contraseña del administrador después del primer login")
  } catch (error) {
    logger.error("Error creando usuario administrador:", error)
    throw error
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initDatabase()
}

module.exports = { initDatabase, createAdminUser }

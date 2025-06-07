/**
 * Script para poblar la base de datos con datos de ejemplo
 *
 * Este script añade datos de prueba para desarrollo y testing.
 */

const { query } = require("../src/config/database")
const { hashPassword } = require("../src/utils/encryption")
const logger = require("../src/utils/logger")

async function seedData() {
  try {
    logger.info("🌱 Iniciando población de datos de ejemplo...")

    await createSampleUsers()
    await createSampleApplications()
    await createSampleAccessRequests()

    logger.info("✅ Datos de ejemplo creados exitosamente")
  } catch (error) {
    logger.error("❌ Error poblando datos:", error)
    process.exit(1)
  }
}

async function createSampleUsers() {
  try {
    // Obtener rol de usuario
    const userRole = await query("SELECT id FROM roles WHERE name = 'user'")
    if (userRole.rows.length === 0) {
      throw new Error("Rol de usuario no encontrado")
    }

    const sampleUsers = [
      {
        username: "juan.perez",
        email: "juan.perez@example.com",
        name: "Juan Pérez",
        password: "Password123!",
      },
      {
        username: "maria.garcia",
        email: "maria.garcia@example.com",
        name: "María García",
        password: "Password123!",
      },
      {
        username: "carlos.lopez",
        email: "carlos.lopez@example.com",
        name: "Carlos López",
        password: "Password123!",
      },
    ]

    for (const userData of sampleUsers) {
      // Verificar si el usuario ya existe
      const existingUser = await query("SELECT id FROM users WHERE email = $1", [userData.email])

      if (existingUser.rows.length === 0) {
        const hashedPassword = await hashPassword(userData.password)

        const user = await query(
          `INSERT INTO users (username, email, password, name, is_approved, is_blocked)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [userData.username, userData.email, hashedPassword, userData.name, true, false],
        )

        // Asignar rol de usuario
        await query("INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)", [user.rows[0].id, userRole.rows[0].id])

        logger.info(`👤 Usuario creado: ${userData.username}`)
      }
    }
  } catch (error) {
    logger.error("Error creando usuarios de ejemplo:", error)
    throw error
  }
}

async function createSampleApplications() {
  try {
    const sampleApps = [
      {
        name: "Home Assistant",
        description: "Automatización del hogar inteligente",
        url: "https://home.qiangnet.dev",
        icon: "🏠",
        config: { type: "automation", category: "smart-home" },
      },
      {
        name: "Grafana",
        description: "Dashboard de monitoreo y métricas",
        url: "https://grafana.qiangnet.dev",
        icon: "📊",
        config: { type: "monitoring", category: "analytics" },
      },
      {
        name: "Plex",
        description: "Servidor multimedia alternativo",
        url: "https://plex.qiangnet.dev",
        icon: "🎭",
        config: { type: "media", category: "entertainment" },
      },
    ]

    for (const appData of sampleApps) {
      // Verificar si la aplicación ya existe
      const existingApp = await query("SELECT id FROM applications WHERE name = $1", [appData.name])

      if (existingApp.rows.length === 0) {
        await query(
          `INSERT INTO applications (name, description, url, icon, config)
           VALUES ($1, $2, $3, $4, $5)`,
          [appData.name, appData.description, appData.url, appData.icon, JSON.stringify(appData.config)],
        )

        logger.info(`📱 Aplicación creada: ${appData.name}`)
      }
    }
  } catch (error) {
    logger.error("Error creando aplicaciones de ejemplo:", error)
    throw error
  }
}

async function createSampleAccessRequests() {
  try {
    // Obtener usuarios y aplicaciones
    const users = await query("SELECT id FROM users WHERE username != 'admin' LIMIT 3")
    const applications = await query("SELECT id FROM applications LIMIT 5")

    if (users.rows.length === 0 || applications.rows.length === 0) {
      logger.info("No hay usuarios o aplicaciones para crear solicitudes de acceso")
      return
    }

    // Crear algunas solicitudes de acceso aprobadas
    for (let i = 0; i < Math.min(users.rows.length, 2); i++) {
      for (let j = 0; j < Math.min(applications.rows.length, 3); j++) {
        const userId = users.rows[i].id
        const applicationId = applications.rows[j].id

        // Verificar si ya existe la solicitud
        const existingRequest = await query(
          "SELECT id FROM user_applications WHERE user_id = $1 AND application_id = $2",
          [userId, applicationId],
        )

        if (existingRequest.rows.length === 0) {
          await query(
            `INSERT INTO user_applications (user_id, application_id, status, approved_at)
             VALUES ($1, $2, $3, NOW())`,
            [userId, applicationId, "approved"],
          )
        }
      }
    }

    // Crear algunas solicitudes pendientes
    if (users.rows.length > 2) {
      const userId = users.rows[2].id
      for (let j = 0; j < Math.min(applications.rows.length, 2); j++) {
        const applicationId = applications.rows[j].id

        const existingRequest = await query(
          "SELECT id FROM user_applications WHERE user_id = $1 AND application_id = $2",
          [userId, applicationId],
        )

        if (existingRequest.rows.length === 0) {
          await query(
            `INSERT INTO user_applications (user_id, application_id, status)
             VALUES ($1, $2, $3)`,
            [userId, applicationId, "pending"],
          )
        }
      }
    }

    logger.info("🔐 Solicitudes de acceso de ejemplo creadas")
  } catch (error) {
    logger.error("Error creando solicitudes de acceso:", error)
    throw error
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedData()
}

module.exports = { seedData }

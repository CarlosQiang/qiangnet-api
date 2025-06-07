/**
 * Modelo de aplicaciones
 *
 * Este archivo contiene las operaciones de base de datos
 * relacionadas con aplicaciones y control de acceso.
 */

const { query } = require("../config/database")
const { v4: uuidv4 } = require("uuid")

/**
 * Buscar aplicación por ID
 */
const findById = async (applicationId) => {
  const result = await query("SELECT * FROM applications WHERE id = $1", [applicationId])
  return result.rows[0]
}

/**
 * Buscar aplicación por nombre
 */
const findByName = async (name) => {
  const result = await query("SELECT * FROM applications WHERE name = $1", [name])
  return result.rows[0]
}

/**
 * Obtener múltiples aplicaciones con paginación
 */
const findMany = async ({ limit, offset, sortBy, sortOrder, userId = null }) => {
  const validSortFields = ["name", "description", "created_at", "updated_at"]
  const validSortOrders = ["asc", "desc"]

  const orderBy = validSortFields.includes(sortBy) ? sortBy : "name"
  const order = validSortOrders.includes(sortOrder) ? sortOrder : "asc"

  const queryText = `
    SELECT id, name, description, url, icon, is_active, created_at, updated_at
    FROM applications
    WHERE is_active = true
    ORDER BY ${orderBy} ${order}
    LIMIT $1 OFFSET $2
  `

  const result = await query(queryText, [limit, offset])
  return result.rows
}

/**
 * Contar total de aplicaciones
 */
const count = async ({ userId = null }) => {
  const queryText = "SELECT COUNT(*) as count FROM applications WHERE is_active = true"
  const result = await query(queryText)
  return Number.parseInt(result.rows[0].count)
}

/**
 * Obtener estadísticas de aplicaciones
 */
const getStats = async () => {
  const result = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE is_active = true) as active,
      COUNT(*) FILTER (WHERE is_active = false) as inactive,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as recent
    FROM applications
  `)

  return result.rows[0]
}

/**
 * Crear nueva aplicación
 */
const create = async (applicationData) => {
  const id = uuidv4()
  const { name, description, url, icon = null, is_active = true, config = {} } = applicationData

  const result = await query(
    `INSERT INTO applications (id, name, description, url, icon, is_active, config, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    [id, name, description, url, icon, is_active, JSON.stringify(config)],
  )

  return result.rows[0]
}

/**
 * Actualizar aplicación
 */
const update = async (applicationId, updateData) => {
  const fields = []
  const values = []
  let paramCount = 1

  Object.keys(updateData).forEach((key) => {
    if (key === "config") {
      fields.push(`${key} = $${paramCount}`)
      values.push(JSON.stringify(updateData[key]))
    } else {
      fields.push(`${key} = $${paramCount}`)
      values.push(updateData[key])
    }
    paramCount++
  })

  fields.push(`updated_at = NOW()`)
  values.push(applicationId)

  const result = await query(
    `UPDATE applications SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`,
    values,
  )

  return result.rows[0]
}

/**
 * Eliminar aplicación (soft delete)
 */
const deleteApplication = async (applicationId) => {
  await query("UPDATE applications SET is_active = false, updated_at = NOW() WHERE id = $1", [applicationId])
}

/**
 * Obtener aplicaciones de un usuario
 */
const findByUserId = async (userId) => {
  const result = await query(
    `
    SELECT a.id, a.name, a.description, a.url, a.icon, ua.status, ua.approved_at
    FROM applications a
    INNER JOIN user_applications ua ON a.id = ua.application_id
    WHERE ua.user_id = $1 AND ua.status = 'approved' AND a.is_active = true
    ORDER BY a.name
  `,
    [userId],
  )

  return result.rows
}

/**
 * Verificar acceso de usuario a aplicación
 */
const checkUserAccess = async (userId, applicationId) => {
  const result = await query(
    `
    SELECT status FROM user_applications
    WHERE user_id = $1 AND application_id = $2
  `,
    [userId, applicationId],
  )

  return result.rows[0]?.status === "approved"
}

/**
 * Buscar solicitud de acceso de usuario
 */
const findUserAccess = async (userId, applicationId) => {
  const result = await query(
    `
    SELECT * FROM user_applications
    WHERE user_id = $1 AND application_id = $2
  `,
    [userId, applicationId],
  )

  return result.rows[0]
}

/**
 * Crear solicitud de acceso
 */
const createAccessRequest = async ({ userId, applicationId, status = "pending" }) => {
  const id = uuidv4()

  const result = await query(
    `INSERT INTO user_applications (id, user_id, application_id, status, requested_at, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
     RETURNING *`,
    [id, userId, applicationId, status],
  )

  return result.rows[0]
}

/**
 * Actualizar solicitud de acceso
 */
const updateAccessRequest = async (userId, applicationId, updateData) => {
  const fields = []
  const values = []
  let paramCount = 1

  Object.keys(updateData).forEach((key) => {
    fields.push(`${key} = $${paramCount}`)
    values.push(updateData[key])
    paramCount++
  })

  fields.push(`updated_at = NOW()`)
  values.push(userId, applicationId)

  const result = await query(
    `UPDATE user_applications SET ${fields.join(", ")} 
     WHERE user_id = $${paramCount} AND application_id = $${paramCount + 1}
     RETURNING *`,
    values,
  )

  return result.rows[0]
}

/**
 * Registrar lanzamiento de aplicación
 */
const logApplicationLaunch = async (userId, applicationId) => {
  const id = uuidv4()

  await query(
    `INSERT INTO application_launches (id, user_id, application_id, launched_at)
     VALUES ($1, $2, $3, NOW())`,
    [id, userId, applicationId],
  )
}

/**
 * Obtener estadísticas de lanzamientos
 */
const getLaunchStats = async (applicationId, days = 30) => {
  const result = await query(
    `
    SELECT 
      COUNT(*) as total_launches,
      COUNT(DISTINCT user_id) as unique_users,
      DATE_TRUNC('day', launched_at) as launch_date,
      COUNT(*) as daily_launches
    FROM application_launches
    WHERE application_id = $1 AND launched_at >= NOW() - INTERVAL '${days} days'
    GROUP BY DATE_TRUNC('day', launched_at)
    ORDER BY launch_date DESC
  `,
    [applicationId],
  )

  return result.rows
}

module.exports = {
  findById,
  findByName,
  findMany,
  count,
  getStats,
  create,
  update,
  delete: deleteApplication,
  findByUserId,
  checkUserAccess,
  findUserAccess,
  createAccessRequest,
  updateAccessRequest,
  logApplicationLaunch,
  getLaunchStats,
}

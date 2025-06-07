/**
 * Modelo de auditoría
 *
 * Este archivo contiene las operaciones de base de datos
 * relacionadas con logs de auditoría y seguimiento de actividades.
 */

const { query } = require("../config/database")
const { v4: uuidv4 } = require("uuid")

/**
 * Crear entrada de auditoría
 */
const create = async (auditData) => {
  const id = uuidv4()
  const { user_id, action, resource_type, resource_id, details = {}, ip_address, user_agent } = auditData

  const result = await query(
    `INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     RETURNING *`,
    [id, user_id, action, resource_type, resource_id, JSON.stringify(details), ip_address, user_agent],
  )

  return result.rows[0]
}

/**
 * Obtener múltiples logs de auditoría con paginación
 */
const findMany = async ({ limit, offset, sortBy, sortOrder }) => {
  const validSortFields = ["created_at", "action", "user_id"]
  const validSortOrders = ["asc", "desc"]

  const orderBy = validSortFields.includes(sortBy) ? sortBy : "created_at"
  const order = validSortOrders.includes(sortOrder) ? sortOrder : "desc"

  const result = await query(
    `
    SELECT 
      al.id,
      al.user_id,
      u.username,
      u.name as user_name,
      al.action,
      al.resource_type,
      al.resource_id,
      al.details,
      al.ip_address,
      al.user_agent,
      al.created_at
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY ${orderBy} ${order}
    LIMIT $1 OFFSET $2
  `,
    [limit, offset],
  )

  return result.rows
}

/**
 * Contar total de logs de auditoría
 */
const count = async () => {
  const result = await query("SELECT COUNT(*) as count FROM audit_logs")
  return Number.parseInt(result.rows[0].count)
}

/**
 * Obtener estadísticas de auditoría
 */
const getStats = async (days = 30) => {
  const result = await query(`
    SELECT 
      COUNT(*) as total_events,
      COUNT(DISTINCT user_id) as unique_users,
      COUNT(*) FILTER (WHERE action LIKE '%LOGIN%') as login_events,
      COUNT(*) FILTER (WHERE action LIKE '%FAILED%' OR action LIKE '%ERROR%') as failed_events,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as last_24h,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '${days} days') as last_period
    FROM audit_logs
    WHERE created_at >= NOW() - INTERVAL '${days} days'
  `)

  return result.rows[0]
}

/**
 * Obtener logs por usuario
 */
const findByUserId = async (userId, { limit = 50, offset = 0 }) => {
  const result = await query(
    `
    SELECT *
    FROM audit_logs
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `,
    [userId, limit, offset],
  )

  return result.rows
}

/**
 * Obtener logs por acción
 */
const findByAction = async (action, { limit = 50, offset = 0 }) => {
  const result = await query(
    `
    SELECT 
      al.*,
      u.username,
      u.name as user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.action = $1
    ORDER BY al.created_at DESC
    LIMIT $2 OFFSET $3
  `,
    [action, limit, offset],
  )

  return result.rows
}

/**
 * Obtener logs por rango de fechas
 */
const findByDateRange = async (startDate, endDate, { limit = 100, offset = 0 }) => {
  const result = await query(
    `
    SELECT 
      al.*,
      u.username,
      u.name as user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.created_at BETWEEN $1 AND $2
    ORDER BY al.created_at DESC
    LIMIT $3 OFFSET $4
  `,
    [startDate, endDate, limit, offset],
  )

  return result.rows
}

/**
 * Obtener actividad reciente
 */
const getRecentActivity = async (limit = 20) => {
  const result = await query(
    `
    SELECT 
      al.action,
      al.resource_type,
      al.created_at,
      u.username,
      u.name as user_name
    FROM audit_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT $1
  `,
    [limit],
  )

  return result.rows
}

/**
 * Limpiar logs antiguos
 */
const cleanOldLogs = async (daysToKeep = 90) => {
  const result = await query(`
    DELETE FROM audit_logs
    WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
  `)

  return result.rowCount
}

module.exports = {
  create,
  findMany,
  count,
  getStats,
  findByUserId,
  findByAction,
  findByDateRange,
  getRecentActivity,
  cleanOldLogs,
}

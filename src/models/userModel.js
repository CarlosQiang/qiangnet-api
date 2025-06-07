/**
 * Modelo de usuarios
 *
 * Este archivo contiene las operaciones de base de datos
 * relacionadas con usuarios, roles y autenticación.
 */

const { query } = require("../config/database")
const { v4: uuidv4 } = require("uuid")

/**
 * Buscar usuario por ID
 */
const findById = async (userId) => {
  const result = await query("SELECT * FROM users WHERE id = $1", [userId])
  return result.rows[0]
}

/**
 * Buscar usuario por username
 */
const findByUsername = async (username) => {
  const result = await query("SELECT * FROM users WHERE username = $1", [username])
  return result.rows[0]
}

/**
 * Buscar usuario por email
 */
const findByEmail = async (email) => {
  const result = await query("SELECT * FROM users WHERE email = $1", [email])
  return result.rows[0]
}

/**
 * Buscar usuario por username o email
 */
const findByUsernameOrEmail = async (identifier) => {
  const result = await query("SELECT * FROM users WHERE username = $1 OR email = $1", [identifier])
  return result.rows[0]
}

/**
 * Crear nuevo usuario
 */
const create = async (userData) => {
  const id = uuidv4()
  const { username, email, password, name, is_approved = false, registration_ip = null } = userData

  const result = await query(
    `INSERT INTO users (id, username, email, password, name, is_approved, registration_ip, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    [id, username, email, password, name, is_approved, registration_ip],
  )

  return result.rows[0]
}

/**
 * Actualizar usuario
 */
const update = async (userId, updateData) => {
  const fields = []
  const values = []
  let paramCount = 1

  Object.keys(updateData).forEach((key) => {
    fields.push(`${key} = $${paramCount}`)
    values.push(updateData[key])
    paramCount++
  })

  fields.push(`updated_at = NOW()`)
  values.push(userId)

  const result = await query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`, values)

  return result.rows[0]
}

/**
 * Eliminar usuario
 */
const deleteUser = async (userId) => {
  await query("DELETE FROM users WHERE id = $1", [userId])
}

/**
 * Obtener múltiples usuarios con paginación
 */
const findMany = async ({ limit, offset, sortBy, sortOrder }) => {
  const validSortFields = ["username", "email", "name", "created_at", "updated_at", "last_login"]
  const validSortOrders = ["asc", "desc"]

  const orderBy = validSortFields.includes(sortBy) ? sortBy : "created_at"
  const order = validSortOrders.includes(sortOrder) ? sortOrder : "desc"

  const result = await query(
    `SELECT id, username, email, name, is_approved, is_blocked, created_at, updated_at, last_login
     FROM users
     ORDER BY ${orderBy} ${order}
     LIMIT $1 OFFSET $2`,
    [limit, offset],
  )

  return result.rows
}

/**
 * Contar total de usuarios
 */
const count = async () => {
  const result = await query("SELECT COUNT(*) as count FROM users")
  return Number.parseInt(result.rows[0].count)
}

/**
 * Obtener estadísticas de usuarios
 */
const getStats = async () => {
  const result = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE is_approved = true) as approved,
      COUNT(*) FILTER (WHERE is_approved = false) as pending,
      COUNT(*) FILTER (WHERE is_blocked = true) as blocked,
      COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as recent
    FROM users
  `)

  return result.rows[0]
}

/**
 * Incrementar intentos de login fallidos
 */
const incrementLoginAttempts = async (userId) => {
  await query("UPDATE users SET login_attempts = login_attempts + 1, updated_at = NOW() WHERE id = $1", [userId])
}

/**
 * Resetear intentos de login
 */
const resetLoginAttempts = async (userId) => {
  await query("UPDATE users SET login_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = $1", [userId])
}

/**
 * Bloquear usuario temporalmente
 */
const lockUser = async (userId, lockDuration) => {
  const lockUntil = new Date(Date.now() + lockDuration)
  await query("UPDATE users SET locked_until = $1, updated_at = NOW() WHERE id = $2", [lockUntil, userId])
}

/**
 * Actualizar último login
 */
const updateLastLogin = async (userId) => {
  await query("UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = $1", [userId])
}

/**
 * Actualizar contraseña
 */
const updatePassword = async (userId, hashedPassword) => {
  await query("UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2", [hashedPassword, userId])
}

// Funciones relacionadas con roles

/**
 * Obtener roles de un usuario
 */
const getUserRoles = async (userId) => {
  const result = await query(
    `
    SELECT r.id, r.name, r.description, r.permissions
    FROM roles r
    INNER JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = $1
  `,
    [userId],
  )

  return result.rows
}

/**
 * Buscar rol por nombre
 */
const findRoleByName = async (roleName) => {
  const result = await query("SELECT * FROM roles WHERE name = $1", [roleName])
  return result.rows[0]
}

/**
 * Buscar rol por ID
 */
const findRoleById = async (roleId) => {
  const result = await query("SELECT * FROM roles WHERE id = $1", [roleId])
  return result.rows[0]
}

/**
 * Obtener todos los roles
 */
const findAllRoles = async () => {
  const result = await query("SELECT * FROM roles ORDER BY name")
  return result.rows
}

/**
 * Buscar roles por nombres
 */
const findRolesByNames = async (roleNames) => {
  const result = await query("SELECT * FROM roles WHERE name = ANY($1)", [roleNames])
  return result.rows
}

/**
 * Crear nuevo rol
 */
const createRole = async (roleData) => {
  const id = uuidv4()
  const { name, description, permissions = [] } = roleData

  const result = await query(
    `INSERT INTO roles (id, name, description, permissions, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING *`,
    [id, name, description, JSON.stringify(permissions)],
  )

  return result.rows[0]
}

/**
 * Actualizar rol
 */
const updateRole = async (roleId, updateData) => {
  const fields = []
  const values = []
  let paramCount = 1

  Object.keys(updateData).forEach((key) => {
    if (key === "permissions") {
      fields.push(`${key} = $${paramCount}`)
      values.push(JSON.stringify(updateData[key]))
    } else {
      fields.push(`${key} = $${paramCount}`)
      values.push(updateData[key])
    }
    paramCount++
  })

  fields.push(`updated_at = NOW()`)
  values.push(roleId)

  const result = await query(`UPDATE roles SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`, values)

  return result.rows[0]
}

/**
 * Eliminar rol
 */
const deleteRole = async (roleId) => {
  await query("DELETE FROM roles WHERE id = $1", [roleId])
}

/**
 * Asignar rol a usuario
 */
const assignRole = async (userId, roleId) => {
  const id = uuidv4()
  await query("INSERT INTO user_roles (id, user_id, role_id, created_at) VALUES ($1, $2, $3, NOW())", [
    id,
    userId,
    roleId,
  ])
}

/**
 * Remover rol de usuario
 */
const removeRole = async (userId, roleId) => {
  await query("DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2", [userId, roleId])
}

/**
 * Remover todos los roles de un usuario
 */
const removeAllUserRoles = async (userId) => {
  await query("DELETE FROM user_roles WHERE user_id = $1", [userId])
}

/**
 * Buscar asignación de rol específica
 */
const findUserRole = async (userId, roleId) => {
  const result = await query("SELECT * FROM user_roles WHERE user_id = $1 AND role_id = $2", [userId, roleId])
  return result.rows[0]
}

/**
 * Contar usuarios con un rol específico
 */
const countUsersWithRole = async (roleId) => {
  const result = await query("SELECT COUNT(*) as count FROM user_roles WHERE role_id = $1", [roleId])
  return Number.parseInt(result.rows[0].count)
}

// Funciones relacionadas con refresh tokens

/**
 * Guardar refresh token
 */
const saveRefreshToken = async (userId, refreshToken, ip, userAgent) => {
  const id = uuidv4()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días

  await query(
    `INSERT INTO refresh_tokens (id, user_id, token, expires_at, ip_address, user_agent, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [id, userId, refreshToken, expiresAt, ip, userAgent],
  )
}

/**
 * Buscar refresh token
 */
const findRefreshToken = async (refreshToken) => {
  const result = await query("SELECT * FROM refresh_tokens WHERE token = $1", [refreshToken])
  return result.rows[0]
}

/**
 * Actualizar refresh token
 */
const updateRefreshToken = async (tokenId, newRefreshToken) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días

  await query("UPDATE refresh_tokens SET token = $1, expires_at = $2, updated_at = NOW() WHERE id = $3", [
    newRefreshToken,
    expiresAt,
    tokenId,
  ])
}

/**
 * Eliminar refresh token
 */
const deleteRefreshToken = async (refreshToken) => {
  await query("DELETE FROM refresh_tokens WHERE token = $1", [refreshToken])
}

/**
 * Eliminar todos los refresh tokens de un usuario
 */
const deleteUserRefreshTokens = async (userId) => {
  await query("DELETE FROM refresh_tokens WHERE user_id = $1", [userId])
}

// Funciones relacionadas con recuperación de contraseña

/**
 * Guardar token de recuperación de contraseña
 */
const savePasswordResetToken = async (userId, token, expiresAt, ip) => {
  const id = uuidv4()

  // Eliminar tokens anteriores del usuario
  await query("DELETE FROM password_reset_tokens WHERE user_id = $1", [userId])

  await query(
    `INSERT INTO password_reset_tokens (id, user_id, token, expires_at, ip_address, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [id, userId, token, expiresAt, ip],
  )
}

/**
 * Buscar token de recuperación de contraseña
 */
const findPasswordResetToken = async (token) => {
  const result = await query("SELECT * FROM password_reset_tokens WHERE token = $1", [token])
  return result.rows[0]
}

/**
 * Eliminar token de recuperación de contraseña
 */
const deletePasswordResetToken = async (token) => {
  await query("DELETE FROM password_reset_tokens WHERE token = $1", [token])
}

module.exports = {
  findById,
  findByUsername,
  findByEmail,
  findByUsernameOrEmail,
  create,
  update,
  delete: deleteUser,
  findMany,
  count,
  getStats,
  incrementLoginAttempts,
  resetLoginAttempts,
  lockUser,
  updateLastLogin,
  updatePassword,
  getUserRoles,
  findRoleByName,
  findRoleById,
  findAllRoles,
  findRolesByNames,
  createRole,
  updateRole,
  deleteRole,
  assignRole,
  removeRole,
  removeAllUserRoles,
  findUserRole,
  countUsersWithRole,
  saveRefreshToken,
  findRefreshToken,
  updateRefreshToken,
  deleteRefreshToken,
  deleteUserRefreshTokens,
  savePasswordResetToken,
  findPasswordResetToken,
  deletePasswordResetToken,
}

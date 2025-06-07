/**
 * Rutas de administración
 *
 * Este archivo define las rutas relacionadas con la administración del sistema
 * como gestión de roles, logs de auditoría, etc.
 */

const express = require("express")
const { param, body } = require("express-validator")
const adminController = require("../controllers/adminController")
const { validate, validateSchema, schemas } = require("../middleware/validation")
const { authenticate, authorize } = require("../middleware/auth")
const { apiLimiter } = require("../middleware/rateLimiter")
const { asyncHandler } = require("../middleware/errorHandler")

const router = express.Router()

// Todas las rutas requieren autenticación y rol de admin
router.use(authenticate)
router.use(authorize(["admin"]))

/**
 * @route GET /api/admin/dashboard
 * @desc Obtener estadísticas del dashboard de administración
 * @access Privado (admin)
 */
router.get("/dashboard", asyncHandler(adminController.getDashboardStats))

/**
 * @route GET /api/admin/users
 * @desc Obtener lista de usuarios para administración
 * @access Privado (admin)
 */
router.get("/users", validateSchema(schemas.pagination, "query"), asyncHandler(adminController.getUsers))

/**
 * @route GET /api/admin/audit-logs
 * @desc Obtener logs de auditoría
 * @access Privado (admin)
 */
router.get("/audit-logs", validateSchema(schemas.pagination, "query"), asyncHandler(adminController.getAuditLogs))

/**
 * @route GET /api/admin/roles
 * @desc Obtener lista de roles
 * @access Privado (admin)
 */
router.get("/roles", asyncHandler(adminController.getRoles))

/**
 * @route POST /api/admin/roles
 * @desc Crear un nuevo rol
 * @access Privado (admin)
 */
router.post(
  "/roles",
  [
    body("name").notEmpty().withMessage("El nombre del rol es requerido"),
    body("description").optional().isString(),
    body("permissions").optional().isArray(),
  ],
  validate,
  asyncHandler(adminController.createRole),
)

/**
 * @route PUT /api/admin/roles/:id
 * @desc Actualizar un rol
 * @access Privado (admin)
 */
router.put(
  "/roles/:id",
  [
    param("id").isUUID().withMessage("ID de rol inválido"),
    body("name").optional().notEmpty().withMessage("El nombre del rol no puede estar vacío"),
    body("description").optional().isString(),
    body("permissions").optional().isArray(),
  ],
  validate,
  asyncHandler(adminController.updateRole),
)

/**
 * @route DELETE /api/admin/roles/:id
 * @desc Eliminar un rol
 * @access Privado (admin)
 */
router.delete(
  "/roles/:id",
  [param("id").isUUID().withMessage("ID de rol inválido")],
  validate,
  asyncHandler(adminController.deleteRole),
)

/**
 * @route POST /api/admin/users/:userId/roles/:roleId
 * @desc Asignar rol a usuario
 * @access Privado (admin)
 */
router.post(
  "/users/:userId/roles/:roleId",
  [
    param("userId").isUUID().withMessage("ID de usuario inválido"),
    param("roleId").isUUID().withMessage("ID de rol inválido"),
  ],
  validate,
  asyncHandler(adminController.assignRole),
)

/**
 * @route DELETE /api/admin/users/:userId/roles/:roleId
 * @desc Remover rol de usuario
 * @access Privado (admin)
 */
router.delete(
  "/users/:userId/roles/:roleId",
  [
    param("userId").isUUID().withMessage("ID de usuario inválido"),
    param("roleId").isUUID().withMessage("ID de rol inválido"),
  ],
  validate,
  asyncHandler(adminController.removeRole),
)

/**
 * @route GET /api/admin/system-info
 * @desc Obtener información del sistema
 * @access Privado (admin)
 */
router.get("/system-info", asyncHandler(adminController.getSystemInfo))

/**
 * @route POST /api/admin/maintenance
 * @desc Activar/desactivar modo mantenimiento
 * @access Privado (admin)
 */
router.post(
  "/maintenance",
  [body("enabled").isBoolean().withMessage("enabled debe ser un booleano")],
  validate,
  asyncHandler(adminController.toggleMaintenance),
)

module.exports = router

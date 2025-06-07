/**
 * Rutas de aplicaciones
 *
 * Este archivo define las rutas relacionadas con la gestión de aplicaciones
 * como listar aplicaciones, obtener detalles, etc.
 */

const express = require("express")
const { param } = require("express-validator")
const applicationController = require("../controllers/applicationController")
const { validate, validateSchema, schemas } = require("../middleware/validation")
const { authenticate, authorize, optionalAuth } = require("../middleware/auth")
const { apiLimiter } = require("../middleware/rateLimiter")
const { asyncHandler } = require("../middleware/errorHandler")

const router = express.Router()

/**
 * @route GET /api/applications
 * @desc Obtener lista de aplicaciones disponibles
 * @access Público (con autenticación opcional)
 */
router.get(
  "/",
  apiLimiter,
  optionalAuth,
  validateSchema(schemas.pagination, "query"),
  asyncHandler(applicationController.getApplications),
)

/**
 * @route GET /api/applications/:id
 * @desc Obtener detalles de una aplicación
 * @access Público (con autenticación opcional)
 */
router.get(
  "/:id",
  apiLimiter,
  optionalAuth,
  [param("id").isUUID().withMessage("ID de aplicación inválido")],
  validate,
  asyncHandler(applicationController.getApplicationById),
)

/**
 * @route GET /api/applications/user
 * @desc Obtener aplicaciones del usuario actual
 * @access Privado
 */
router.get("/user", authenticate, asyncHandler(applicationController.getUserApplications))

/**
 * @route POST /api/applications/:id/access
 * @desc Solicitar acceso a una aplicación
 * @access Privado
 */
router.post(
  "/:id/access",
  authenticate,
  [param("id").isUUID().withMessage("ID de aplicación inválido")],
  validate,
  asyncHandler(applicationController.requestAccess),
)

/**
 * @route GET /api/applications/:id/access
 * @desc Verificar acceso a una aplicación
 * @access Privado
 */
router.get(
  "/:id/access",
  authenticate,
  [param("id").isUUID().withMessage("ID de aplicación inválido")],
  validate,
  asyncHandler(applicationController.checkAccess),
)

/**
 * @route POST /api/applications/:id/launch
 * @desc Lanzar una aplicación (obtener URL y token)
 * @access Privado
 */
router.post(
  "/:id/launch",
  authenticate,
  [param("id").isUUID().withMessage("ID de aplicación inválido")],
  validate,
  asyncHandler(applicationController.launchApplication),
)

// Rutas de administración de aplicaciones (solo admin)

/**
 * @route POST /api/applications
 * @desc Crear una nueva aplicación
 * @access Privado (admin)
 */
router.post("/", authenticate, authorize(["admin"]), asyncHandler(applicationController.createApplication))

/**
 * @route PUT /api/applications/:id
 * @desc Actualizar una aplicación
 * @access Privado (admin)
 */
router.put(
  "/:id",
  authenticate,
  authorize(["admin"]),
  [param("id").isUUID().withMessage("ID de aplicación inválido")],
  validate,
  asyncHandler(applicationController.updateApplication),
)

/**
 * @route DELETE /api/applications/:id
 * @desc Eliminar una aplicación
 * @access Privado (admin)
 */
router.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  [param("id").isUUID().withMessage("ID de aplicación inválido")],
  validate,
  asyncHandler(applicationController.deleteApplication),
)

/**
 * @route POST /api/applications/:id/approve/:userId
 * @desc Aprobar acceso de un usuario a una aplicación
 * @access Privado (admin)
 */
router.post(
  "/:id/approve/:userId",
  authenticate,
  authorize(["admin"]),
  [
    param("id").isUUID().withMessage("ID de aplicación inválido"),
    param("userId").isUUID().withMessage("ID de usuario inválido"),
  ],
  validate,
  asyncHandler(applicationController.approveUserAccess),
)

/**
 * @route POST /api/applications/:id/revoke/:userId
 * @desc Revocar acceso de un usuario a una aplicación
 * @access Privado (admin)
 */
router.post(
  "/:id/revoke/:userId",
  authenticate,
  authorize(["admin"]),
  [
    param("id").isUUID().withMessage("ID de aplicación inválido"),
    param("userId").isUUID().withMessage("ID de usuario inválido"),
  ],
  validate,
  asyncHandler(applicationController.revokeUserAccess),
)

module.exports = router

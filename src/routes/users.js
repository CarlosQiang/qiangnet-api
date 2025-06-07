/**
 * Rutas de usuarios
 *
 * Este archivo define las rutas relacionadas con la gestión de usuarios
 * como obtener perfil, actualizar datos, etc.
 */

const express = require("express")
const { body, param } = require("express-validator")
const userController = require("../controllers/userController")
const { validate, validateSchema, schemas } = require("../middleware/validation")
const { authenticate, authorize } = require("../middleware/auth")
const { apiLimiter } = require("../middleware/rateLimiter")
const { asyncHandler } = require("../middleware/errorHandler")

const router = express.Router()

/**
 * @route GET /api/users/profile
 * @desc Obtener perfil del usuario actual
 * @access Privado
 */
router.get("/profile", authenticate, asyncHandler(userController.getProfile))

/**
 * @route PUT /api/users/profile
 * @desc Actualizar perfil del usuario actual
 * @access Privado
 */
router.put(
  "/profile",
  authenticate,
  [
    body("name").optional().isLength({ min: 1, max: 100 }).withMessage("El nombre debe tener entre 1 y 100 caracteres"),
    body("email").optional().isEmail().withMessage("Email inválido"),
  ],
  validate,
  asyncHandler(userController.updateProfile),
)

/**
 * @route GET /api/users/:id
 * @desc Obtener un usuario por ID
 * @access Privado (admin)
 */
router.get(
  "/:id",
  authenticate,
  authorize(["admin"]),
  [param("id").isUUID().withMessage("ID de usuario inválido")],
  validate,
  asyncHandler(userController.getUserById),
)

/**
 * @route GET /api/users
 * @desc Obtener lista de usuarios (paginada)
 * @access Privado (admin)
 */
router.get(
  "/",
  authenticate,
  authorize(["admin"]),
  validateSchema(schemas.pagination, "query"),
  asyncHandler(userController.getUsers),
)

/**
 * @route PUT /api/users/:id
 * @desc Actualizar un usuario por ID
 * @access Privado (admin)
 */
router.put(
  "/:id",
  authenticate,
  authorize(["admin"]),
  [
    param("id").isUUID().withMessage("ID de usuario inválido"),
    body("name").optional().isLength({ min: 1, max: 100 }).withMessage("El nombre debe tener entre 1 y 100 caracteres"),
    body("email").optional().isEmail().withMessage("Email inválido"),
    body("is_approved").optional().isBoolean().withMessage("is_approved debe ser un booleano"),
    body("is_blocked").optional().isBoolean().withMessage("is_blocked debe ser un booleano"),
    body("roles").optional().isArray().withMessage("roles debe ser un array"),
  ],
  validate,
  asyncHandler(userController.updateUser),
)

/**
 * @route DELETE /api/users/:id
 * @desc Eliminar un usuario por ID
 * @access Privado (admin)
 */
router.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  [param("id").isUUID().withMessage("ID de usuario inválido")],
  validate,
  asyncHandler(userController.deleteUser),
)

/**
 * @route POST /api/users/:id/approve
 * @desc Aprobar un usuario
 * @access Privado (admin)
 */
router.post(
  "/:id/approve",
  authenticate,
  authorize(["admin"]),
  [param("id").isUUID().withMessage("ID de usuario inválido")],
  validate,
  asyncHandler(userController.approveUser),
)

/**
 * @route POST /api/users/:id/block
 * @desc Bloquear un usuario
 * @access Privado (admin)
 */
router.post(
  "/:id/block",
  authenticate,
  authorize(["admin"]),
  [param("id").isUUID().withMessage("ID de usuario inválido")],
  validate,
  asyncHandler(userController.blockUser),
)

/**
 * @route POST /api/users/:id/unblock
 * @desc Desbloquear un usuario
 * @access Privado (admin)
 */
router.post(
  "/:id/unblock",
  authenticate,
  authorize(["admin"]),
  [param("id").isUUID().withMessage("ID de usuario inválido")],
  validate,
  asyncHandler(userController.unblockUser),
)

module.exports = router

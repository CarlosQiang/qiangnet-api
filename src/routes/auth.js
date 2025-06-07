/**
 * Rutas de autenticación
 *
 * Este archivo define las rutas relacionadas con la autenticación
 * como login, registro, recuperación de contraseña, etc.
 */

const express = require("express")
const { body } = require("express-validator")
const authController = require("../controllers/authController")
const { validate, validateSchema, schemas } = require("../middleware/validation")
const { authLimiter, registerLimiter } = require("../middleware/rateLimiter")
const { authenticate } = require("../middleware/auth")
const { asyncHandler } = require("../middleware/errorHandler")

const router = express.Router()

/**
 * @route POST /api/auth/login
 * @desc Iniciar sesión
 * @access Público
 */
router.post(
  "/login",
  authLimiter,
  [
    body("username").notEmpty().withMessage("El nombre de usuario es requerido"),
    body("password").notEmpty().withMessage("La contraseña es requerida"),
  ],
  validate,
  asyncHandler(authController.login),
)

/**
 * @route POST /api/auth/register
 * @desc Registrar un nuevo usuario
 * @access Público
 */
router.post(
  "/register",
  registerLimiter,
  [
    body("username")
      .isLength({ min: 3, max: 30 })
      .withMessage("El nombre de usuario debe tener entre 3 y 30 caracteres")
      .matches(/^[a-zA-Z0-9_-]+$/)
      .withMessage("El nombre de usuario solo puede contener letras, números, guiones y guiones bajos"),
    body("email").isEmail().withMessage("Email inválido"),
    body("password").isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres"),
    body("name").notEmpty().withMessage("El nombre es requerido"),
  ],
  validate,
  asyncHandler(authController.register),
)

/**
 * @route POST /api/auth/refresh
 * @desc Refrescar token de acceso
 * @access Público (con refresh token)
 */
router.post(
  "/refresh",
  authLimiter,
  [body("refreshToken").notEmpty().withMessage("El token de actualización es requerido")],
  validate,
  asyncHandler(authController.refreshToken),
)

/**
 * @route POST /api/auth/logout
 * @desc Cerrar sesión
 * @access Privado
 */
router.post("/logout", authenticate, asyncHandler(authController.logout))

/**
 * @route POST /api/auth/forgot-password
 * @desc Solicitar recuperación de contraseña
 * @access Público
 */
router.post(
  "/forgot-password",
  authLimiter,
  [body("email").isEmail().withMessage("Email inválido")],
  validate,
  asyncHandler(authController.forgotPassword),
)

/**
 * @route POST /api/auth/reset-password
 * @desc Restablecer contraseña con token
 * @access Público (con token)
 */
router.post(
  "/reset-password",
  authLimiter,
  [
    body("token").notEmpty().withMessage("El token es requerido"),
    body("password").isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres"),
  ],
  validate,
  asyncHandler(authController.resetPassword),
)

/**
 * @route POST /api/auth/change-password
 * @desc Cambiar contraseña (usuario autenticado)
 * @access Privado
 */
router.post(
  "/change-password",
  authenticate,
  [
    body("currentPassword").notEmpty().withMessage("La contraseña actual es requerida"),
    body("newPassword").isLength({ min: 8 }).withMessage("La nueva contraseña debe tener al menos 8 caracteres"),
  ],
  validate,
  asyncHandler(authController.changePassword),
)

/**
 * @route GET /api/auth/me
 * @desc Obtener información del usuario actual
 * @access Privado
 */
router.get("/me", authenticate, asyncHandler(authController.getCurrentUser))

module.exports = router

/**
 * QiangNet API Backend - Punto de entrada principal
 *
 * Este archivo configura y arranca el servidor Express con todas las
 * configuraciones necesarias para seguridad, logging y rutas.
 */

const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const compression = require("compression")
const morgan = require("morgan")
const { rateLimit } = require("express-rate-limit")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

// Importar configuraciones
const config = require("./config/server")
const logger = require("./utils/logger")
const errorHandler = require("./middleware/errorHandler")

// Importar rutas
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const applicationRoutes = require("./routes/applications")
const adminRoutes = require("./routes/admin")

// Crear aplicación Express
const app = express()

// Configurar directorio de logs
const logDirectory = path.join(__dirname, "../logs")
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true })
}

// Configurar middleware
app.use(helmet()) // Seguridad HTTP
app.use(compression()) // Compresión de respuestas
app.use(express.json({ limit: "1mb" })) // Parseo de JSON con límite
app.use(express.urlencoded({ extended: true, limit: "1mb" }))

// Configurar CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400, // 24 horas
}
app.use(cors(corsOptions))

// Configurar rate limiting
const limiter = rateLimit({
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos por defecto
  max: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 solicitudes por ventana por defecto
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes, por favor intente más tarde" },
})
app.use(limiter)

// Configurar logging
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev"
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  }),
)

// Rutas de la API
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/applications", applicationRoutes)
app.use("/api/admin", adminRoutes)

// Ruta de health check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  })
})

// Ruta para documentación API (opcional)
app.use("/api-docs", express.static(path.join(__dirname, "../docs/api")))

// Ruta 404 para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" })
})

// Middleware de manejo de errores
app.use(errorHandler)

// Iniciar servidor
const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  logger.info(`Servidor iniciado en puerto ${PORT} en modo ${process.env.NODE_ENV}`)
  logger.info(`API disponible en http://localhost:${PORT}/api`)
  logger.info(`Health check disponible en http://localhost:${PORT}/health`)
})

// Manejo de errores no capturados
process.on("uncaughtException", (error) => {
  logger.error("Error no capturado:", error)
  // En producción, podríamos querer reiniciar el proceso
  if (process.env.NODE_ENV === "production") {
    process.exit(1)
  }
})

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Promesa rechazada no manejada:", reason)
  // En producción, podríamos querer reiniciar el proceso
  if (process.env.NODE_ENV === "production") {
    process.exit(1)
  }
})

module.exports = app // Para testing

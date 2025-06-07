# QiangNet API Backend

API REST segura para el sistema de gestión de acceso a aplicaciones domésticas QiangNet.

## 🚀 Características

- **Autenticación JWT** con refresh tokens
- **Control de acceso basado en roles** (RBAC)
- **Rate limiting** y protección contra ataques
- **Logs de auditoría** completos
- **Gestión de aplicaciones** y control de acceso
- **API RESTful** bien documentada
- **Arquitectura escalable** y mantenible
- **Seguridad de nivel empresarial**

## 📋 Requisitos

- Node.js 18+ 
- PostgreSQL 15+
- Docker y Docker Compose (opcional)

## 🛠️ Instalación

### Opción 1: Instalación Local

\`\`\`bash
# Clonar el repositorio
git clone <tu-repositorio>
cd qiangnet-api-backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Inicializar base de datos
npm run migrate

# Poblar con datos de ejemplo (opcional)
npm run seed

# Iniciar en desarrollo
npm run dev
\`\`\`

### Opción 2: Docker Compose

\`\`\`bash
# Clonar el repositorio
git clone <tu-repositorio>
cd qiangnet-api-backend

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar con Docker
npm run docker:run

# Inicializar base de datos
docker-compose exec api npm run migrate
\`\`\`

## ⚙️ Configuración

### Variables de Entorno

\`\`\`env
# Servidor
PORT=3001
NODE_ENV=development
HOST=localhost
FRONTEND_URL=http://localhost:3000

# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qiangnet_db
DB_USER=qiangnet_admin
DB_PASSWORD=tu_password_seguro

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro_de_32_caracteres_minimo
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Encriptación
ENCRYPTION_KEY=tu_clave_de_encriptacion_de_32_caracteres

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_TO_FILE=true

# Email (opcional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_de_aplicacion
EMAIL_FROM=noreply@qiangnet.dev
\`\`\`

## 📚 API Endpoints

### Autenticación

\`\`\`
POST /api/auth/login          # Iniciar sesión
POST /api/auth/register       # Registrar usuario
POST /api/auth/refresh        # Refrescar token
POST /api/auth/logout         # Cerrar sesión
POST /api/auth/forgot-password # Recuperar contraseña
POST /api/auth/reset-password  # Restablecer contraseña
POST /api/auth/change-password # Cambiar contraseña
GET  /api/auth/me             # Obtener usuario actual
\`\`\`

### Usuarios

\`\`\`
GET  /api/users/profile       # Obtener perfil
PUT  /api/users/profile       # Actualizar perfil
GET  /api/users/:id           # Obtener usuario (admin)
GET  /api/users               # Listar usuarios (admin)
PUT  /api/users/:id           # Actualizar usuario (admin)
DELETE /api/users/:id         # Eliminar usuario (admin)
POST /api/users/:id/approve   # Aprobar usuario (admin)
POST /api/users/:id/block     # Bloquear usuario (admin)
POST /api/users/:id/unblock   # Desbloquear usuario (admin)
\`\`\`

### Aplicaciones

\`\`\`
GET  /api/applications        # Listar aplicaciones
GET  /api/applications/:id    # Obtener aplicación
GET  /api/applications/user   # Aplicaciones del usuario
POST /api/applications/:id/access    # Solicitar acceso
GET  /api/applications/:id/access    # Verificar acceso
POST /api/applications/:id/launch    # Lanzar aplicación
POST /api/applications        # Crear aplicación (admin)
PUT  /api/applications/:id    # Actualizar aplicación (admin)
DELETE /api/applications/:id  # Eliminar aplicación (admin)
\`\`\`

### Administración

\`\`\`
GET  /api/admin/dashboard     # Estadísticas del dashboard
GET  /api/admin/users         # Gestión de usuarios
GET  /api/admin/audit-logs    # Logs de auditoría
GET  /api/admin/roles         # Gestión de roles
POST /api/admin/roles         # Crear rol
PUT  /api/admin/roles/:id     # Actualizar rol
DELETE /api/admin/roles/:id   # Eliminar rol
GET  /api/admin/system-info   # Información del sistema
POST /api/admin/maintenance   # Modo mantenimiento
\`\`\`

## 🔒 Seguridad

### Características de Seguridad

- **Autenticación JWT** con tokens de acceso y refresh
- **Rate limiting** configurable por endpoint
- **Validación de entrada** con sanitización
- **Protección CORS** configurable
- **Headers de seguridad** con Helmet
- **Encriptación** de datos sensibles
- **Logs de auditoría** de todas las acciones
- **Bloqueo automático** por intentos fallidos
- **Tokens de recuperación** seguros

### Roles y Permisos

- **admin**: Acceso completo al sistema
- **user**: Acceso a aplicaciones asignadas

## 📊 Monitoreo y Logs

### Logs de Auditoría

Todas las acciones importantes se registran:

- Inicios de sesión exitosos y fallidos
- Cambios en usuarios y roles
- Acceso a aplicaciones
- Cambios de configuración
- Errores de seguridad

### Health Check

\`\`\`
GET /health
\`\`\`

Respuesta:
\`\`\`json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
\`\`\`

## 🧪 Testing

\`\`\`bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
\`\`\`

## 📦 Despliegue

### Docker

\`\`\`bash
# Construir imagen
npm run docker:build

# Ejecutar en producción
docker-compose -f docker-compose.prod.yml up -d
\`\`\`

### Variables de Producción

\`\`\`env
NODE_ENV=production
JWT_SECRET=clave_super_segura_de_produccion
DB_SSL=true
LOG_TO_FILE=true
RATE_LIMIT_MAX_REQUESTS=50
\`\`\`

## 🔧 Mantenimiento

### Scripts Útiles

\`\`\`bash
# Limpiar logs antiguos
npm run clean:logs

# Backup de base de datos
npm run backup:db

# Verificar estado de la base de datos
npm run check:db

# Migrar base de datos
npm run migrate

# Poblar datos de ejemplo
npm run seed
\`\`\`

### Monitoreo

\`\`\`bash
# Ver logs en tiempo real
docker-compose logs -f api

# Estadísticas de la base de datos
npm run stats:db

# Verificar salud del sistema
curl http://localhost:3001/health
\`\`\`

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

- **Documentación**: [Wiki del proyecto](wiki)
- **Issues**: [GitHub Issues](issues)
- **Email**: soporte@qiangnet.dev

## 🗺️ Roadmap

- [ ] Autenticación OAuth2
- [ ] API GraphQL
- [ ] Notificaciones push
- [ ] Métricas avanzadas
- [ ] Integración con LDAP
- [ ] API de webhooks
- [ ] Dashboard en tiempo real

---

**QiangNet API Backend** - Sistema de gestión de acceso seguro y escalable 🔒✨

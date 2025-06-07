import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyToken, createAuditLog } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !payload.roles.includes("admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const table = searchParams.get("table")

    if (!table) {
      // Return list of tables
      const tables = [
        { name: "users", label: "Usuarios" },
        { name: "roles", label: "Roles" },
        { name: "user_roles", label: "Roles de Usuario" },
        { name: "sessions", label: "Sesiones" },
        { name: "audit_logs", label: "Logs de Auditoría" },
        { name: "app_settings", label: "Configuración" },
        { name: "access_lists", label: "Listas de Acceso" },
      ]

      return NextResponse.json({ tables })
    }

    // Get table data
    let data
    let schema

    switch (table) {
      case "users":
        data = await prisma.user.findMany({
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
        schema = [
          { field: "id", label: "ID", type: "string" },
          { field: "name", label: "Nombre", type: "string" },
          { field: "email", label: "Email", type: "string" },
          { field: "approved", label: "Aprobado", type: "boolean" },
          { field: "blocked", label: "Bloqueado", type: "boolean" },
          { field: "whitelisted", label: "En Lista Blanca", type: "boolean" },
          { field: "lastLogin", label: "Último Login", type: "datetime" },
          { field: "createdAt", label: "Creado", type: "datetime" },
          { field: "updatedAt", label: "Actualizado", type: "datetime" },
        ]
        break
      case "roles":
        data = await prisma.role.findMany({
          orderBy: { name: "asc" },
        })
        schema = [
          { field: "id", label: "ID", type: "string" },
          { field: "name", label: "Nombre", type: "string" },
          { field: "description", label: "Descripción", type: "string" },
          { field: "permissions", label: "Permisos", type: "json" },
          { field: "createdAt", label: "Creado", type: "datetime" },
          { field: "updatedAt", label: "Actualizado", type: "datetime" },
        ]
        break
      case "user_roles":
        data = await prisma.userRole.findMany({
          include: {
            user: true,
            role: true,
          },
        })
        schema = [
          { field: "id", label: "ID", type: "string" },
          { field: "userId", label: "ID Usuario", type: "string" },
          { field: "roleId", label: "ID Rol", type: "string" },
          { field: "user.name", label: "Nombre Usuario", type: "string" },
          { field: "role.name", label: "Nombre Rol", type: "string" },
        ]
        break
      case "sessions":
        data = await prisma.session.findMany({
          include: {
            user: true,
          },
          orderBy: { createdAt: "desc" },
        })
        schema = [
          { field: "id", label: "ID", type: "string" },
          { field: "userId", label: "ID Usuario", type: "string" },
          { field: "user.name", label: "Nombre Usuario", type: "string" },
          { field: "ipAddress", label: "Dirección IP", type: "string" },
          { field: "userAgent", label: "User Agent", type: "string" },
          { field: "expiresAt", label: "Expira", type: "datetime" },
          { field: "createdAt", label: "Creado", type: "datetime" },
        ]
        break
      case "audit_logs":
        data = await prisma.auditLog.findMany({
          include: {
            user: true,
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
        schema = [
          { field: "id", label: "ID", type: "string" },
          { field: "userId", label: "ID Usuario", type: "string" },
          { field: "user.name", label: "Nombre Usuario", type: "string" },
          { field: "action", label: "Acción", type: "string" },
          { field: "details", label: "Detalles", type: "json" },
          { field: "ipAddress", label: "Dirección IP", type: "string" },
          { field: "userAgent", label: "User Agent", type: "string" },
          { field: "createdAt", label: "Creado", type: "datetime" },
        ]
        break
      case "app_settings":
        data = await prisma.appSettings.findMany()
        schema = [
          { field: "id", label: "ID", type: "string" },
          { field: "siteName", label: "Nombre del Sitio", type: "string" },
          { field: "logoUrl", label: "URL del Logo", type: "string" },
          { field: "bgImage", label: "Imagen de Fondo", type: "string" },
          { field: "theme", label: "Tema", type: "json" },
          { field: "allowRegistration", label: "Permitir Registro", type: "boolean" },
          { field: "requireApproval", label: "Requerir Aprobación", type: "boolean" },
          { field: "createdAt", label: "Creado", type: "datetime" },
          { field: "updatedAt", label: "Actualizado", type: "datetime" },
        ]
        break
      case "access_lists":
        data = await prisma.accessList.findMany({
          orderBy: { createdAt: "desc" },
        })
        schema = [
          { field: "id", label: "ID", type: "string" },
          { field: "type", label: "Tipo", type: "string" },
          { field: "value", label: "Valor", type: "string" },
          { field: "listType", label: "Tipo de Lista", type: "string" },
          { field: "reason", label: "Razón", type: "string" },
          { field: "createdBy", label: "Creado Por", type: "string" },
          { field: "createdAt", label: "Creado", type: "datetime" },
          { field: "updatedAt", label: "Actualizado", type: "datetime" },
        ]
        break
      default:
        return NextResponse.json({ error: "Tabla no encontrada" }, { status: 404 })
    }

    await createAuditLog("DATABASE_QUERY", payload.userId, { table })

    return NextResponse.json({ table, data, schema })
  } catch (error) {
    console.error("Error querying database:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !payload.roles.includes("admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query es requerido" }, { status: 400 })
    }

    // For security, only allow SELECT queries
    if (!query.trim().toLowerCase().startsWith("select")) {
      return NextResponse.json({ error: "Solo se permiten consultas SELECT" }, { status: 400 })
    }

    // Execute raw query
    const result = await prisma.$queryRawUnsafe(query)

    await createAuditLog("DATABASE_CUSTOM_QUERY", payload.userId, { query })

    return NextResponse.json({ result })
  } catch (error) {
    console.error("Error executing custom query:", error)
    return NextResponse.json({ error: "Error ejecutando consulta: " + (error as Error).message }, { status: 500 })
  }
}

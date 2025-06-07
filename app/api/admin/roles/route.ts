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

    const roles = await prisma.role.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json(roles)
  } catch (error) {
    console.error("Error fetching roles:", error)
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

    const { name, description, permissions } = await request.json()

    if (!name || !description) {
      return NextResponse.json({ error: "Nombre y descripción son requeridos" }, { status: 400 })
    }

    const existingRole = await prisma.role.findUnique({
      where: { name },
    })

    if (existingRole) {
      return NextResponse.json({ error: "Ya existe un rol con ese nombre" }, { status: 400 })
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: permissions || [],
      },
    })

    await createAuditLog("ROLE_CREATED", payload.userId, { roleId: role.id, name })

    return NextResponse.json({ message: "Rol creado exitosamente", role })
  } catch (error) {
    console.error("Error creating role:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyToken, createAuditLog } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const roleId = params.id

    // Check if role name already exists (excluding current role)
    const existingRole = await prisma.role.findFirst({
      where: {
        name,
        NOT: { id: roleId },
      },
    })

    if (existingRole) {
      return NextResponse.json({ error: "Ya existe un rol con ese nombre" }, { status: 400 })
    }

    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        name,
        description,
        permissions: permissions || [],
      },
    })

    await createAuditLog("ROLE_UPDATED", payload.userId, { roleId, name, permissions })

    return NextResponse.json({ message: "Rol actualizado exitosamente", role })
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !payload.roles.includes("admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const roleId = params.id

    // Check if role is admin or user (cannot delete system roles)
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!role) {
      return NextResponse.json({ error: "Rol no encontrado" }, { status: 404 })
    }

    if (role.name === "admin" || role.name === "user") {
      return NextResponse.json({ error: "No se pueden eliminar roles del sistema" }, { status: 400 })
    }

    // Check if role is assigned to any users
    const userRoles = await prisma.userRole.findMany({
      where: { roleId },
    })

    if (userRoles.length > 0) {
      return NextResponse.json({ error: "No se puede eliminar un rol que está asignado a usuarios" }, { status: 400 })
    }

    await prisma.role.delete({
      where: { id: roleId },
    })

    await createAuditLog("ROLE_DELETED", payload.userId, { roleId, name: role.name })

    return NextResponse.json({ message: "Rol eliminado exitosamente" })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

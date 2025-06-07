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

    const { name, email, roleIds } = await request.json()
    const userId = params.id

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
    })

    // Update roles
    if (roleIds) {
      // Remove existing roles
      await prisma.userRole.deleteMany({
        where: { userId },
      })

      // Add new roles
      if (roleIds.length > 0) {
        const roles = await prisma.role.findMany({
          where: { name: { in: roleIds } },
        })

        await Promise.all(
          roles.map((role) =>
            prisma.userRole.create({
              data: {
                userId,
                roleId: role.id,
              },
            }),
          ),
        )
      }
    }

    await createAuditLog("USER_UPDATED_BY_ADMIN", payload.userId, { targetUserId: userId })

    return NextResponse.json({ message: "Usuario actualizado exitosamente", user })
  } catch (error) {
    console.error("Error updating user:", error)
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

    const userId = params.id

    // Don't allow deleting self
    if (userId === payload.userId) {
      return NextResponse.json({ error: "No puedes eliminarte a ti mismo" }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    await createAuditLog("USER_DELETED_BY_ADMIN", payload.userId, { targetUserId: userId })

    return NextResponse.json({ message: "Usuario eliminado exitosamente" })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

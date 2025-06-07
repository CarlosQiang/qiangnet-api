import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyToken, createAuditLog } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Don't allow blocking self
    if (userId === payload.userId) {
      return NextResponse.json({ error: "No puedes bloquearte a ti mismo" }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { blocked: true },
    })

    await createAuditLog("USER_BLOCKED", payload.userId, { targetUserId: userId })

    return NextResponse.json({ message: "Usuario bloqueado exitosamente", user })
  } catch (error) {
    console.error("Error blocking user:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

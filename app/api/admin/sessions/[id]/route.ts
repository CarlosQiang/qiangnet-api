import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyToken, createAuditLog } from "@/lib/auth"

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

    const sessionId = params.id

    // Don't allow deleting own session
    const currentSession = await prisma.session.findFirst({
      where: { token },
    })

    if (currentSession?.id === sessionId) {
      return NextResponse.json({ error: "No puedes terminar tu propia sesión" }, { status: 400 })
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true },
    })

    if (!session) {
      return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 })
    }

    await prisma.session.delete({
      where: { id: sessionId },
    })

    await createAuditLog("SESSION_TERMINATED", payload.userId, {
      sessionId,
      targetUserId: session.userId,
      targetUserEmail: session.user.email,
    })

    return NextResponse.json({ message: "Sesión terminada exitosamente" })
  } catch (error) {
    console.error("Error terminating session:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

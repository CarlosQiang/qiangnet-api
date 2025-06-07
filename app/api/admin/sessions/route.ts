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

    const sessions = await prisma.session.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !payload.roles.includes("admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { sessionIds } = await request.json()

    if (!sessionIds || !Array.isArray(sessionIds)) {
      return NextResponse.json({ error: "IDs de sesión requeridos" }, { status: 400 })
    }

    // Don't allow deleting own session
    const currentSession = await prisma.session.findFirst({
      where: { token },
    })

    const filteredSessionIds = sessionIds.filter((id) => id !== currentSession?.id)

    await prisma.session.deleteMany({
      where: {
        id: { in: filteredSessionIds },
      },
    })

    await createAuditLog("SESSIONS_TERMINATED", payload.userId, { sessionIds: filteredSessionIds })

    return NextResponse.json({ message: "Sesiones terminadas exitosamente" })
  } catch (error) {
    console.error("Error terminating sessions:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

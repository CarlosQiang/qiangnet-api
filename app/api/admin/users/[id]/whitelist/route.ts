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

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        whitelisted: true,
        approved: true,
        blocked: false,
      },
    })

    await createAuditLog("USER_WHITELISTED", payload.userId, { targetUserId: userId })

    return NextResponse.json({ message: "Usuario añadido a lista blanca", user })
  } catch (error) {
    console.error("Error whitelisting user:", error)
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

    const user = await prisma.user.update({
      where: { id: userId },
      data: { whitelisted: false },
    })

    await createAuditLog("USER_REMOVED_FROM_WHITELIST", payload.userId, { targetUserId: userId })

    return NextResponse.json({ message: "Usuario removido de lista blanca", user })
  } catch (error) {
    console.error("Error removing user from whitelist:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

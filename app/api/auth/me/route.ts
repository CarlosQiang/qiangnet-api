import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, getUserWithRoles } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const user = await getUserWithRoles(payload.userId)
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const roles = user.roles.map((ur) => ur.role.name)

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      approved: user.approved,
      blocked: user.blocked,
      roles,
    })
  } catch (error) {
    console.error("Me error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

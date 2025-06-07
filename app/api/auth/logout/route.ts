import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyToken, createAuditLog } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (token) {
      const payload = verifyToken(token)

      if (payload) {
        // Eliminar sesión de la base de datos
        await prisma.session.deleteMany({
          where: { token },
        })

        // Log del logout
        await createAuditLog("LOGOUT", payload.userId)
      }
    }

    const response = NextResponse.json({ message: "Logout exitoso" })
    response.cookies.delete("auth-token")

    return response
  } catch (error) {
    console.error("Logout error:", error)
    const response = NextResponse.json({ message: "Logout exitoso" })
    response.cookies.delete("auth-token")
    return response
  }
}

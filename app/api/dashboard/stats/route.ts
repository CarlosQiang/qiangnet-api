import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

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

    // Get total users count
    const totalUsers = await prisma.user.count()

    // Get recent activity
    const recentActivity = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    })

    const stats = {
      totalUsers,
      activeServices: 3, // Jellyfin, Nextcloud, Portainer
      lastLogin: new Date().toISOString(),
      systemStatus: "online" as const,
      recentActivity,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

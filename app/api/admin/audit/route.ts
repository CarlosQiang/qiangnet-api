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
    if (!payload || !payload.roles.includes("admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") || undefined
    const userId = searchParams.get("userId") || undefined
    const fromDate = searchParams.get("fromDate") ? new Date(searchParams.get("fromDate")!) : undefined
    const toDate = searchParams.get("toDate") ? new Date(searchParams.get("toDate")!) : undefined
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const skip = (page - 1) * limit

    // Count total records for pagination
    const totalCount = await prisma.auditLog.count({
      where: {
        ...(action && { action }),
        ...(userId && { userId }),
        ...(fromDate &&
          toDate && {
            createdAt: {
              gte: fromDate,
              lte: toDate,
            },
          }),
      },
    })

    // Get audit logs with pagination
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        ...(action && { action }),
        ...(userId && { userId }),
        ...(fromDate &&
          toDate && {
            createdAt: {
              gte: fromDate,
              lte: toDate,
            },
          }),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    })

    return NextResponse.json({
      data: auditLogs,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

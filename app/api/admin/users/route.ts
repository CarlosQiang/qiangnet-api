import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyToken, hashPassword, createAuditLog } from "@/lib/auth"

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

    const users = await prisma.user.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !payload.roles.includes("admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { name, email, password, roleIds } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        approved: true, // Admin created users are auto-approved
      },
    })

    // Assign roles
    if (roleIds && roleIds.length > 0) {
      const roles = await prisma.role.findMany({
        where: { name: { in: roleIds } },
      })

      await Promise.all(
        roles.map((role) =>
          prisma.userRole.create({
            data: {
              userId: user.id,
              roleId: role.id,
            },
          }),
        ),
      )
    }

    await createAuditLog("USER_CREATED_BY_ADMIN", payload.userId, { targetUserId: user.id, email })

    return NextResponse.json({ message: "Usuario creado exitosamente", user })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

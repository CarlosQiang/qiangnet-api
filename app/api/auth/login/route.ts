import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyPassword, generateToken, createAuditLog } from "@/lib/auth"
import { checkRateLimit, sanitizeInput, isValidEmail } from "@/lib/security"

export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get("x-forwarded-for") || request.ip || "unknown"
  const userAgent = request.headers.get("user-agent") || "unknown"

  try {
    // Verificar rate limiting
    const rateLimit = await checkRateLimit(request, "login")
    if (!rateLimit.allowed) {
      await createAuditLog(
        "LOGIN_RATE_LIMITED",
        undefined,
        { ip: ipAddress, remaining: rateLimit.remaining },
        ipAddress,
        userAgent,
      )
      return NextResponse.json(
        {
          error: "Demasiados intentos de inicio de sesión. Inténtalo más tarde.",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        { status: 429 },
      )
    }

    const body = await request.json()
    const email = sanitizeInput(body.email || "")
    const password = body.password || ""

    if (!email || !password) {
      await createAuditLog("LOGIN_FAILED", undefined, { reason: "Missing credentials" }, ipAddress, userAgent)
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      await createAuditLog("LOGIN_FAILED", undefined, { email, reason: "Invalid email format" }, ipAddress, userAgent)
      return NextResponse.json({ error: "Formato de email inválido" }, { status: 400 })
    }

    // Verificar listas de acceso
    const ipBlacklisted = await prisma.accessList.findFirst({
      where: {
        type: "ip",
        value: ipAddress,
        listType: "blacklist",
      },
    })

    const emailBlacklisted = await prisma.accessList.findFirst({
      where: {
        type: "email",
        value: email,
        listType: "blacklist",
      },
    })

    if (ipBlacklisted || emailBlacklisted) {
      await createAuditLog(
        "LOGIN_BLOCKED_BLACKLIST",
        undefined,
        { email, reason: ipBlacklisted ? "IP blacklisted" : "Email blacklisted" },
        ipAddress,
        userAgent,
      )
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    })

    if (!user) {
      await createAuditLog("LOGIN_FAILED", undefined, { email, reason: "User not found" }, ipAddress, userAgent)
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    // Verificar si está bloqueado por intentos fallidos
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await createAuditLog("LOGIN_BLOCKED", user.id, { reason: "Account locked" }, ipAddress, userAgent)
      return NextResponse.json(
        {
          error: "Cuenta temporalmente bloqueada por múltiples intentos fallidos",
          lockedUntil: user.lockedUntil,
        },
        { status: 423 },
      )
    }

    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      // Incrementar intentos fallidos
      const newAttempts = user.loginAttempts + 1
      const shouldLock = newAttempts >= 5
      const lockUntil = shouldLock ? new Date(Date.now() + 30 * 60 * 1000) : null // 30 minutos

      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: newAttempts,
          lockedUntil: lockUntil,
        },
      })

      await createAuditLog(
        "LOGIN_FAILED",
        user.id,
        { reason: "Invalid password", attempts: newAttempts, locked: shouldLock },
        ipAddress,
        userAgent,
      )

      if (shouldLock) {
        return NextResponse.json(
          { error: "Cuenta bloqueada por múltiples intentos fallidos. Inténtalo en 30 minutos." },
          { status: 423 },
        )
      }

      return NextResponse.json(
        { error: `Credenciales inválidas. ${5 - newAttempts} intentos restantes.` },
        { status: 401 },
      )
    }

    // Verificar si está bloqueado por admin
    if (user.blocked) {
      await createAuditLog("LOGIN_BLOCKED", user.id, { reason: "User blocked by admin" }, ipAddress, userAgent)
      return NextResponse.json({ error: "Cuenta bloqueada por el administrador" }, { status: 403 })
    }

    // Verificar si está aprobado
    if (!user.approved) {
      await createAuditLog("LOGIN_PENDING", user.id, { reason: "User not approved" }, ipAddress, userAgent)
      return NextResponse.json({ error: "Cuenta pendiente de aprobación" }, { status: 403 })
    }

    // Login exitoso - resetear intentos fallidos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
      },
    })

    // Generar token
    const roles = user.roles.map((ur) => ur.role.name)
    const token = generateToken({
      userId: user.id,
      email: user.email,
      roles,
    })

    // Guardar sesión
    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        ipAddress,
        userAgent,
      },
    })

    // Log exitoso
    await createAuditLog("LOGIN_SUCCESS", user.id, { roles }, ipAddress, userAgent)

    // Configurar cookie segura
    const response = NextResponse.json({
      message: "Login exitoso",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles,
      },
    })

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 horas
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    await createAuditLog("LOGIN_ERROR", undefined, { error: error.message }, ipAddress, userAgent)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

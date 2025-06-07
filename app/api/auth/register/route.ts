import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { hashPassword, createAuditLog } from "@/lib/auth"
import { checkRateLimit, sanitizeInput, isValidEmail, validatePassword } from "@/lib/security"

export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get("x-forwarded-for") || request.ip || "unknown"
  const userAgent = request.headers.get("user-agent") || "unknown"

  try {
    // Verificar rate limiting
    const rateLimit = await checkRateLimit(request, "register")
    if (!rateLimit.allowed) {
      await createAuditLog(
        "REGISTER_RATE_LIMITED",
        undefined,
        { ip: ipAddress, remaining: rateLimit.remaining },
        ipAddress,
        userAgent,
      )
      return NextResponse.json(
        {
          error: "Demasiados intentos de registro. Inténtalo más tarde.",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        { status: 429 },
      )
    }

    const body = await request.json()
    const name = body.name?.trim() || ""
    const email = sanitizeInput(body.email || "")
    const password = body.password || ""

    // Validaciones
    if (!name || !email || !password) {
      await createAuditLog("REGISTER_FAILED", undefined, { reason: "Missing fields" }, ipAddress, userAgent)
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      await createAuditLog("REGISTER_FAILED", undefined, { email, reason: "Invalid email" }, ipAddress, userAgent)
      return NextResponse.json({ error: "Formato de email inválido" }, { status: 400 })
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      await createAuditLog(
        "REGISTER_FAILED",
        undefined,
        { email, reason: "Weak password", errors: passwordValidation.errors },
        ipAddress,
        userAgent,
      )
      return NextResponse.json({ error: passwordValidation.errors[0] }, { status: 400 })
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      await createAuditLog("REGISTER_FAILED", undefined, { email, reason: "Email exists" }, ipAddress, userAgent)
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 })
    }

    // Verificar configuración de registro
    const settings = await prisma.appSettings.findFirst()
    if (settings && !settings.allowRegistration) {
      await createAuditLog(
        "REGISTER_BLOCKED",
        undefined,
        { email, reason: "Registration disabled" },
        ipAddress,
        userAgent,
      )
      return NextResponse.json({ error: "El registro está deshabilitado" }, { status: 403 })
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(password)

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        approved: settings?.requireApproval === false, // Auto-aprobar si no se requiere aprobación
      },
    })

    // Log del registro
    await createAuditLog(
      "USER_REGISTERED",
      user.id,
      { email, autoApproved: !settings?.requireApproval },
      ipAddress,
      userAgent,
    )

    const message =
      settings?.requireApproval !== false
        ? "Usuario registrado exitosamente. Pendiente de aprobación."
        : "Usuario registrado y aprobado exitosamente."

    return NextResponse.json({
      message,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        approved: user.approved,
      },
    })
  } catch (error) {
    console.error("Register error:", error)
    await createAuditLog("REGISTER_ERROR", undefined, { error: error.message }, ipAddress, userAgent)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

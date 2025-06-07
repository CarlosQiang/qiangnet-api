import type { NextRequest } from "next/server"
import { prisma } from "./db"

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

export async function checkRateLimit(request: NextRequest, action: string): Promise<RateLimitResult> {
  const ipAddress = request.headers.get("x-forwarded-for") || request.ip || "unknown"
  const key = `${action}:${ipAddress}`
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutos
  const maxAttempts = action === "login" ? 5 : 10

  try {
    // Buscar intentos recientes
    const recentAttempts = await prisma.rateLimitLog.findMany({
      where: {
        key,
        createdAt: {
          gte: new Date(now - windowMs),
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    if (recentAttempts.length >= maxAttempts) {
      const oldestAttempt = recentAttempts[recentAttempts.length - 1]
      const resetTime = oldestAttempt.createdAt.getTime() + windowMs

      return {
        allowed: false,
        remaining: 0,
        resetTime,
      }
    }

    // Registrar este intento
    await prisma.rateLimitLog.create({
      data: {
        key,
        ipAddress,
        action,
      },
    })

    return {
      allowed: true,
      remaining: maxAttempts - recentAttempts.length - 1,
      resetTime: now + windowMs,
    }
  } catch (error) {
    console.error("Rate limit check error:", error)
    // En caso de error, permitir la acción pero con límite bajo
    return {
      allowed: true,
      remaining: 1,
      resetTime: now + windowMs,
    }
  }
}

export function sanitizeInput(input: string): string {
  if (!input) return ""
  return input.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!password) {
    errors.push("La contraseña es requerida")
    return { isValid: false, errors }
  }

  if (password.length < 8) {
    errors.push("La contraseña debe tener al menos 8 caracteres")
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Debe contener al menos una letra mayúscula")
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Debe contener al menos una letra minúscula")
  }

  if (!/\d/.test(password)) {
    errors.push("Debe contener al menos un número")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

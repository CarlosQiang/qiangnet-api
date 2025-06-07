import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { prisma } from "./db"

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_key_change_in_production"

export interface TokenPayload {
  userId: string
  email: string
  roles: string[]
}

// Función para generar UUID compatible con Node.js
export function generateUUID(): string {
  // Usar crypto.randomUUID si está disponible (Node.js 14.17+)
  if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  // Fallback para versiones anteriores de Node.js
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "24h" })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}

export async function getUserWithRoles(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  })
}

export async function createAuditLog(
  action: string,
  userId?: string,
  details?: any,
  ipAddress?: string,
  userAgent?: string,
) {
  try {
    return await prisma.auditLog.create({
      data: {
        action,
        userId,
        details,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error("Error creating audit log:", error)
    return null
  }
}

export async function validateUserAccess(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) return false
    if (user.blocked) return false
    if (!user.approved) return false

    return true
  } catch (error) {
    console.error("Error validating user access:", error)
    return false
  }
}

export async function getUserRoleNames(userId: string): Promise<string[]> {
  try {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    })

    return userRoles.map((ur) => ur.role.name)
  } catch (error) {
    console.error("Error getting user roles:", error)
    return []
  }
}

export async function hasPermission(userId: string, requiredPermission: string): Promise<boolean> {
  try {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: true,
      },
    })

    // Check if user has admin role or the specific permission
    for (const userRole of userRoles) {
      const permissions = userRole.role.permissions as string[]
      if (userRole.role.name === "admin" || permissions.includes("*") || permissions.includes(requiredPermission)) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error("Error checking permissions:", error)
    return false
  }
}

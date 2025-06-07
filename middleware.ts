import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken, validateUserAccess } from "./lib/auth"

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value
  const { pathname } = request.nextUrl

  // Rutas públicas
  const publicPaths = ["/", "/login", "/register", "/api/auth/login", "/api/auth/register"]

  if (publicPaths.includes(pathname) || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next()
  }

  // API routes that don't need full auth check
  if (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/public/")) {
    return NextResponse.next()
  }

  // Verificar token
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    return NextResponse.redirect(new URL("/login", request.url))
  }

  const payload = verifyToken(token)
  if (!payload) {
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Token inválido" }, { status: 401 })
      : NextResponse.redirect(new URL("/login", request.url))

    response.cookies.delete("auth-token")
    return response
  }

  // Verificar si el usuario está bloqueado o pendiente de aprobación
  const isValidUser = await validateUserAccess(payload.userId)
  if (!isValidUser) {
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Usuario bloqueado o pendiente de aprobación" }, { status: 403 })
      : NextResponse.redirect(new URL("/login", request.url))

    response.cookies.delete("auth-token")
    return response
  }

  // Verificar acceso a rutas de admin
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const hasAdminRole = payload.roles.includes("admin")
    if (!hasAdminRole) {
      return pathname.startsWith("/api/")
        ? NextResponse.json({ error: "No autorizado" }, { status: 403 })
        : NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|public).*)"],
}

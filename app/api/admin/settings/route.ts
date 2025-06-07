import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyToken, getUserWithRoles } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de admin
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const user = await getUserWithRoles(payload.userId)
    if (!user || !user.roles.some((ur) => ur.role.name === "admin")) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    // Obtener configuración
    let settings = await prisma.appSettings.findFirst()

    if (!settings) {
      // Crear configuración por defecto
      settings = await prisma.appSettings.create({
        data: {
          siteName: "QiangNet",
          siteDescription: "Tu centro de entretenimiento personal",
          logoUrl: "",
          bgImage: "",
          heroTitle: "Tu Centro de Entretenimiento Personal",
          heroSubtitle:
            "Accede a tu contenido multimedia favorito de forma segura y privada desde cualquier dispositivo",
          theme: {
            primary: "#3b82f6",
            secondary: "#1f2937",
            accent: "#06b6d4",
          },
          allowRegistration: true,
          requireApproval: true,
          mainServices: [
            {
              name: "Jellyfin",
              description: "Centro multimedia personal con streaming seguro",
              url: "https://media.qiangnet.dev",
              icon: "🎬",
              enabled: true,
            },
          ],
          additionalServices: [
            {
              name: "Nextcloud",
              description: "Almacenamiento en la nube privado",
              url: "https://cloud.qiangnet.dev",
              icon: "☁️",
              enabled: true,
            },
            {
              name: "Portainer",
              description: "Gestión de contenedores",
              url: "http://192.168.8.200:9000",
              icon: "🐳",
              enabled: true,
            },
          ],
          animations: {
            enableParticles: true,
            enableGradientAnimation: true,
            enableFloatingElements: true,
          },
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Admin settings error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación y permisos de admin
    const token = request.cookies.get("auth-token")?.value
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const user = await getUserWithRoles(payload.userId)
    if (!user || !user.roles.some((ur) => ur.role.name === "admin")) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const data = await request.json()

    let settings = await prisma.appSettings.findFirst()

    if (settings) {
      settings = await prisma.appSettings.update({
        where: { id: settings.id },
        data,
      })
    } else {
      settings = await prisma.appSettings.create({
        data,
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Admin settings update error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

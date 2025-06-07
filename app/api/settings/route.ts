import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
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

    // Asegurar que los servicios existen
    const response = {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      logoUrl: settings.logoUrl,
      bgImage: settings.bgImage,
      heroTitle: settings.heroTitle,
      heroSubtitle: settings.heroSubtitle,
      theme: settings.theme || {
        primary: "#3b82f6",
        secondary: "#1f2937",
        accent: "#06b6d4",
      },
      mainServices: settings.mainServices || [
        {
          name: "Jellyfin",
          description: "Centro multimedia personal con streaming seguro",
          url: "https://media.qiangnet.dev",
          icon: "🎬",
          enabled: true,
        },
      ],
      additionalServices: settings.additionalServices || [
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
      animations: settings.animations || {
        enableParticles: true,
        enableGradientAnimation: true,
        enableFloatingElements: true,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Settings error:", error)
    // Devolver configuración por defecto en caso de error
    return NextResponse.json({
      siteName: "QiangNet",
      siteDescription: "Tu centro de entretenimiento personal",
      logoUrl: "",
      bgImage: "",
      heroTitle: "Tu Centro de Entretenimiento Personal",
      heroSubtitle: "Accede a tu contenido multimedia favorito de forma segura y privada desde cualquier dispositivo",
      theme: {
        primary: "#3b82f6",
        secondary: "#1f2937",
        accent: "#06b6d4",
      },
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
    })
  }
}

export async function PUT(request: Request) {
  try {
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
    console.error("Settings update error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function setupComplete() {
  console.log("🚀 Configuración completa de QiangNet...")

  try {
    // Verificar conexión a la base de datos
    await prisma.$connect()
    console.log("✅ Conexión a la base de datos exitosa")

    // Crear roles
    console.log("📝 Creando roles...")
    const adminRole = await prisma.role.upsert({
      where: { name: "admin" },
      update: {},
      create: {
        name: "admin",
        description: "Administrador del sistema",
      },
    })

    const userRole = await prisma.role.upsert({
      where: { name: "user" },
      update: {},
      create: {
        name: "user",
        description: "Usuario estándar",
      },
    })

    // Crear usuario administrador
    console.log("👤 Creando usuario administrador...")
    const adminPassword = process.env.ADMIN_PASSWORD || "QiangNet2024!@#$SecureAdmin"
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    const adminUser = await prisma.user.upsert({
      where: { email: process.env.ADMIN_EMAIL || "admin@qiangnet.dev" },
      update: {
        password: hashedPassword,
        approved: true,
        blocked: false,
      },
      create: {
        email: process.env.ADMIN_EMAIL || "admin@qiangnet.dev",
        name: "Administrador",
        password: hashedPassword,
        approved: true,
        blocked: false,
      },
    })

    // Asignar rol de admin
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    })

    // Crear configuración por defecto
    console.log("⚙️ Creando configuración por defecto...")
    await prisma.appSettings.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
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

    console.log("✅ Configuración completa exitosa!")
    console.log("🔑 Credenciales de administrador:")
    console.log(`   Email: ${process.env.ADMIN_EMAIL || "admin@qiangnet.dev"}`)
    console.log(`   Contraseña: ${adminPassword}`)
    console.log("🌐 Accede al panel de administración en: /admin")

    // Verificar datos
    const userCount = await prisma.user.count()
    const roleCount = await prisma.role.count()
    console.log(`📊 Usuarios creados: ${userCount}`)
    console.log(`📊 Roles creados: ${roleCount}`)
  } catch (error) {
    console.error("❌ Error en la configuración:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

setupComplete().catch((e) => {
  console.error(e)
  process.exit(1)
})

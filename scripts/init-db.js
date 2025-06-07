const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Conectando a la base de datos...")

    // Crear roles si no existen
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

    console.log("✅ Roles creados/actualizados")

    // Generar hash de contraseña para admin
    const adminPassword = process.env.ADMIN_PASSWORD || "QiangNet2024!@#$SecureAdmin"
    const hashedPassword = await bcrypt.hash(adminPassword, 10)
    console.log("✅ Hash de contraseña generado")

    // Crear usuario admin si no existe
    const adminEmail = process.env.ADMIN_EMAIL || "admin@qiangnet.dev"
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: hashedPassword,
        isApproved: true,
        status: "ACTIVE",
        roles: {
          connect: { id: adminRole.id },
        },
      },
      create: {
        email: adminEmail,
        name: "Administrador",
        password: hashedPassword,
        isApproved: true,
        status: "ACTIVE",
        roles: {
          connect: { id: adminRole.id },
        },
      },
    })

    console.log("✅ Usuario administrador creado/actualizado")

    // Crear configuración del sitio si no existe
    const config = await prisma.siteConfig.upsert({
      where: { id: 1 },
      update: {},
      create: {
        siteName: "QiangNet Secure",
        siteDescription: "Plataforma segura para servicios domésticos",
        heroTitle: "Bienvenido a QiangNet Secure",
        heroSubtitle: "Tu plataforma segura para servicios domésticos",
        primaryColor: "#3B82F6",
        secondaryColor: "#10B981",
        logoUrl: "/logo.png",
        faviconUrl: "/favicon.ico",
        footerText: "© 2024 QiangNet Secure. Todos los derechos reservados.",
        maintenanceMode: false,
        registrationEnabled: true,
        theme: "light",
      },
    })

    console.log("✅ Configuración inicial creada")

    console.log("\n🎉 Base de datos inicializada correctamente!")
    console.log("📋 Credenciales de administrador:")
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Contraseña: ${adminPassword}`)

    console.log("\n🌐 Accede a la aplicación en: http://localhost:3000")
    console.log("⚙️ Panel de administración: http://localhost:3000/admin")
  } catch (error) {
    console.error("❌ Error al inicializar la base de datos:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

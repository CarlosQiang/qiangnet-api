const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log("🔍 Verificando conexión a la base de datos...")

    // Verificar conexión
    await prisma.$connect()
    console.log("✅ Conexión a la base de datos exitosa")

    // Verificar tablas
    const users = await prisma.user.findMany()
    console.log(`📊 Usuarios encontrados: ${users.length}`)

    const roles = await prisma.role.findMany()
    console.log(`📊 Roles encontrados: ${roles.length}`)

    const settings = await prisma.appSettings.findMany()
    console.log(`📊 Configuraciones encontradas: ${settings.length}`)

    // Mostrar datos
    console.log("\n👤 Usuarios:")
    users.forEach((user) => {
      console.log(`  - ${user.email} (${user.name}) - Aprobado: ${user.approved}`)
    })

    console.log("\n🔐 Roles:")
    roles.forEach((role) => {
      console.log(`  - ${role.name}: ${role.description}`)
    })
  } catch (error) {
    console.error("❌ Error:", error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()

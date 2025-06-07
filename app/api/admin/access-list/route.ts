import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyToken, createAuditLog } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !payload.roles.includes("admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const listType = searchParams.get("listType") || undefined
    const type = searchParams.get("type") || undefined

    const accessList = await prisma.accessList.findMany({
      where: {
        ...(listType && { listType }),
        ...(type && { type }),
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(accessList)
  } catch (error) {
    console.error("Error fetching access list:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !payload.roles.includes("admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const { type, value, listType, reason } = await request.json()

    if (!type || !value || !listType) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    if (type !== "ip" && type !== "email") {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 })
    }

    if (listType !== "whitelist" && listType !== "blacklist") {
      return NextResponse.json({ error: "Tipo de lista inválido" }, { status: 400 })
    }

    // Check if entry already exists
    const existingEntry = await prisma.accessList.findFirst({
      where: { type, value },
    })

    if (existingEntry) {
      // Update existing entry
      const updatedEntry = await prisma.accessList.update({
        where: { id: existingEntry.id },
        data: { listType, reason, updatedAt: new Date(), createdBy: payload.userId },
      })

      await createAuditLog("ACCESS_LIST_UPDATED", payload.userId, {
        id: updatedEntry.id,
        type,
        value,
        listType,
        reason,
      })

      return NextResponse.json({ message: "Entrada actualizada", entry: updatedEntry })
    }

    // Create new entry
    const newEntry = await prisma.accessList.create({
      data: {
        type,
        value,
        listType,
        reason,
        createdBy: payload.userId,
      },
    })

    await createAuditLog("ACCESS_LIST_CREATED", payload.userId, { id: newEntry.id, type, value, listType, reason })

    return NextResponse.json({ message: "Entrada creada", entry: newEntry })
  } catch (error) {
    console.error("Error creating access list entry:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

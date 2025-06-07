import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyToken, createAuditLog } from "@/lib/auth"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || !payload.roles.includes("admin")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const id = params.id

    const entry = await prisma.accessList.findUnique({
      where: { id },
    })

    if (!entry) {
      return NextResponse.json({ error: "Entrada no encontrada" }, { status: 404 })
    }

    await prisma.accessList.delete({
      where: { id },
    })

    await createAuditLog("ACCESS_LIST_DELETED", payload.userId, {
      id,
      type: entry.type,
      value: entry.value,
      listType: entry.listType,
    })

    return NextResponse.json({ message: "Entrada eliminada" })
  } catch (error) {
    console.error("Error deleting access list entry:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

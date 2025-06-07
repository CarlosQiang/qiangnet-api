"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Plus, Trash2, Search } from "lucide-react"
import { Button } from "@/app/components/ui/Button"
import { Input } from "@/app/components/ui/Input"
import { Card } from "@/app/components/ui/Card"
import { Modal } from "@/app/components/ui/Modal"

interface AccessListEntry {
  id: string
  type: "ip" | "email"
  value: string
  listType: "whitelist" | "blacklist"
  reason?: string
  createdAt: string
  updatedAt: string
}

export default function AccessListPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<AccessListEntry[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "whitelist" | "blacklist">("all")
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    type: "ip" as "ip" | "email",
    value: "",
    listType: "blacklist" as "whitelist" | "blacklist",
    reason: "",
  })
  const [formError, setFormError] = useState("")

  useEffect(() => {
    fetchAccessList()
  }, [filterType])

  const fetchAccessList = async () => {
    try {
      setLoading(true)
      const url = filterType === "all" ? "/api/admin/access-list" : `/api/admin/access-list?listType=${filterType}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      } else {
        console.error("Error fetching access list")
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    if (!formData.value.trim()) {
      setFormError("El valor es requerido")
      return
    }

    // Validate email format if type is email
    if (formData.type === "email" && !formData.value.includes("@")) {
      setFormError("Email inválido")
      return
    }

    try {
      const response = await fetch("/api/admin/access-list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setShowModal(false)
        setFormData({
          type: "ip",
          value: "",
          listType: "blacklist",
          reason: "",
        })
        fetchAccessList()
      } else {
        const data = await response.json()
        setFormError(data.error || "Error al guardar")
      }
    } catch (error) {
      setFormError("Error de conexión")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta entrada?")) return

    try {
      const response = await fetch(`/api/admin/access-list/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchAccessList()
      } else {
        console.error("Error deleting entry")
      }
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const filteredEntries = entries.filter((entry) => {
    return (
      entry.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reason?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center mr-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">Listas de Acceso</h1>
                <p className="text-secondary-600">Gestiona listas blancas y negras de IPs y emails</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push("/admin")} variant="outline">
                Volver al Panel
              </Button>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Entrada
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <div className="p-6 border-b border-secondary-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-semibold text-secondary-900">Entradas de Control de Acceso</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as "all" | "whitelist" | "blacklist")}
                    className="input-field"
                  >
                    <option value="all">Todas las listas</option>
                    <option value="whitelist">Lista Blanca</option>
                    <option value="blacklist">Lista Negra</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Lista
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Razón
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center">
                        <div className="loading-spinner mx-auto" />
                      </td>
                    </tr>
                  ) : filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-secondary-500">
                        No se encontraron entradas
                      </td>
                    </tr>
                  ) : (
                    filteredEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-secondary-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-secondary-100 text-secondary-800">
                            {entry.type === "ip" ? "IP" : "Email"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{entry.value}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              entry.listType === "whitelist"
                                ? "bg-success-100 text-success-800"
                                : "bg-error-100 text-error-800"
                            }`}
                          >
                            {entry.listType === "whitelist" ? "Lista Blanca" : "Lista Negra"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{entry.reason || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(entry.id)}
                            className="text-error-600 border-error-600 hover:bg-error-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-secondary-200 bg-secondary-50 text-sm text-secondary-500">
              {filteredEntries.length} entradas encontradas
            </div>
          </Card>
        </div>
      </main>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva Entrada de Control de Acceso"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">{formError}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as "ip" | "email" })}
              className="input-field"
              required
            >
              <option value="ip">Dirección IP</option>
              <option value="email">Email</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Valor</label>
            <Input
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder={formData.type === "ip" ? "192.168.1.1" : "usuario@ejemplo.com"}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Tipo de Lista</label>
            <select
              value={formData.listType}
              onChange={(e) => setFormData({ ...formData, listType: e.target.value as "whitelist" | "blacklist" })}
              className="input-field"
              required
            >
              <option value="blacklist">Lista Negra (Bloquear)</option>
              <option value="whitelist">Lista Blanca (Permitir)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">Razón (opcional)</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Motivo del bloqueo o permiso..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

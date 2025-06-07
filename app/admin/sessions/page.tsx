"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Monitor, Trash2, Search, RefreshCw, MapPin, Clock } from "lucide-react"
import { Button } from "@/app/components/ui/Button"
import { Input } from "@/app/components/ui/Input"
import { Card } from "@/app/components/ui/Card"
import { formatDate } from "@/lib/utils"

interface Session {
  id: string
  userId: string
  token: string
  expiresAt: string
  createdAt: string
  ipAddress?: string
  userAgent?: string
  user: {
    id: string
    name: string
    email: string
  }
}

export default function SessionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<Session[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/sessions")
      if (response.ok) {
        const data = await response.json()
        setSessions(data)
      } else {
        console.error("Error fetching sessions")
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTerminateSession = async (sessionId: string) => {
    if (!confirm("¿Estás seguro de que quieres terminar esta sesión?")) return

    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchSessions()
      } else {
        const data = await response.json()
        alert(data.error || "Error terminando sesión")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error de conexión")
    }
  }

  const handleTerminateSelected = async () => {
    if (selectedSessions.length === 0) return
    if (!confirm(`¿Estás seguro de que quieres terminar ${selectedSessions.length} sesiones?`)) return

    try {
      const response = await fetch("/api/admin/sessions", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionIds: selectedSessions }),
      })

      if (response.ok) {
        setSelectedSessions([])
        fetchSessions()
      } else {
        const data = await response.json()
        alert(data.error || "Error terminando sesiones")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error de conexión")
    }
  }

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId],
    )
  }

  const toggleSelectAll = () => {
    if (selectedSessions.length === filteredSessions.length) {
      setSelectedSessions([])
    } else {
      setSelectedSessions(filteredSessions.map((session) => session.id))
    }
  }

  const filteredSessions = sessions.filter(
    (session) =>
      session.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.userAgent?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const parseUserAgent = (userAgent?: string) => {
    if (!userAgent) return { browser: "Desconocido", os: "Desconocido" }

    let browser = "Desconocido"
    let os = "Desconocido"

    // Detect browser
    if (userAgent.includes("Chrome")) browser = "Chrome"
    else if (userAgent.includes("Firefox")) browser = "Firefox"
    else if (userAgent.includes("Safari")) browser = "Safari"
    else if (userAgent.includes("Edge")) browser = "Edge"

    // Detect OS
    if (userAgent.includes("Windows")) os = "Windows"
    else if (userAgent.includes("Mac")) os = "macOS"
    else if (userAgent.includes("Linux")) os = "Linux"
    else if (userAgent.includes("Android")) os = "Android"
    else if (userAgent.includes("iOS")) os = "iOS"

    return { browser, os }
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center mr-4">
                <Monitor className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900">Gestión de Sesiones</h1>
                <p className="text-secondary-600">Monitorea y controla las sesiones activas</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.push("/admin")} variant="outline">
                Volver al Panel
              </Button>
              <Button onClick={fetchSessions} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
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
                <h3 className="text-lg font-semibold text-secondary-900">
                  Sesiones Activas ({filteredSessions.length})
                </h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
                    <Input
                      placeholder="Buscar sesiones..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {selectedSessions.length > 0 && (
                    <Button onClick={handleTerminateSelected} variant="outline" className="text-error-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Terminar Seleccionadas ({selectedSessions.length})
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedSessions.length === filteredSessions.length && filteredSessions.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-secondary-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Dispositivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Sesión
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
                  ) : filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-secondary-500">
                        No se encontraron sesiones
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((session) => {
                      const { browser, os } = parseUserAgent(session.userAgent)
                      const isExpired = new Date(session.expiresAt) < new Date()

                      return (
                        <tr key={session.id} className="hover:bg-secondary-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedSessions.includes(session.id)}
                              onChange={() => toggleSessionSelection(session.id)}
                              className="rounded border-secondary-300"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-secondary-900">{session.user.name}</div>
                              <div className="text-sm text-secondary-500">{session.user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 text-secondary-400 mr-2" />
                              <div>
                                <div className="text-sm text-secondary-900">{session.ipAddress || "Desconocida"}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm text-secondary-900">{browser}</div>
                              <div className="text-sm text-secondary-500">{os}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 text-secondary-400 mr-2" />
                                <div>
                                  <div className="text-sm text-secondary-900">
                                    Creada: {formatDate(session.createdAt)}
                                  </div>
                                  <div className={`text-sm ${isExpired ? "text-error-500" : "text-secondary-500"}`}>
                                    Expira: {formatDate(session.expiresAt)}
                                  </div>
                                </div>
                              </div>
                              {isExpired && (
                                <span className="inline-flex px-2 py-1 text-xs rounded-full bg-error-100 text-error-800">
                                  Expirada
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTerminateSession(session.id)}
                              className="text-error-600 border-error-600 hover:bg-error-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-secondary-200 bg-secondary-50 text-sm text-secondary-500">
              {filteredSessions.length} sesiones encontradas
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Shield,
  Users,
  Server,
  Activity,
  Settings,
  LogOut,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import { Button } from "../components/ui/Button"
import { Card } from "../components/ui/Card"

interface User {
  id: string
  email: string
  name: string
  roles: string[]
  approved: boolean
  createdAt: string
}

interface DashboardStats {
  totalUsers: number
  activeServices: number
  lastLogin: string
  systemStatus: "online" | "warning" | "offline"
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
    fetchStats()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        router.push("/login")
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (response.ok) {
        const statsData = await response.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
      // Set default stats if API fails
      setStats({
        totalUsers: 1,
        activeServices: 3,
        lastLogin: new Date().toISOString(),
        systemStatus: "online",
      })
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const services = [
    {
      name: "Jellyfin",
      description: "Centro multimedia personal",
      url: "https://media.qiangnet.dev",
      icon: "🎬",
      status: "online",
    },
    {
      name: "Nextcloud",
      description: "Almacenamiento en la nube",
      url: "https://cloud.qiangnet.dev",
      icon: "☁️",
      status: "online",
    },
    {
      name: "Portainer",
      description: "Gestión de contenedores",
      url: "http://192.168.8.200:9000",
      icon: "🐳",
      status: "online",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="loading-spinner h-12 w-12" />
      </div>
    )
  }

  if (!user?.approved) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-warning-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-900 mb-4">Cuenta Pendiente</h1>
          <p className="text-secondary-600 mb-6">
            Tu cuenta está pendiente de aprobación por un administrador. Te notificaremos cuando sea aprobada.
          </p>
          <Button onClick={handleLogout} variant="outline">
            Cerrar Sesión
          </Button>
        </Card>
      </div>
    )
  }

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
                <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
                <p className="text-secondary-600">Bienvenido, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user.roles?.includes("admin") && (
                <Button onClick={() => router.push("/admin")} variant="outline" className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button onClick={handleLogout} variant="ghost" className="flex items-center">
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600">Usuarios Totales</p>
                    <p className="text-2xl font-bold text-secondary-900">{stats?.totalUsers || 0}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                    <Server className="h-6 w-6 text-success-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600">Servicios Activos</p>
                    <p className="text-2xl font-bold text-secondary-900">{stats?.activeServices || 0}</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="p-6">
                <div className="flex items-center">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      stats?.systemStatus === "online"
                        ? "bg-success-100"
                        : stats?.systemStatus === "warning"
                          ? "bg-warning-100"
                          : "bg-error-100"
                    }`}
                  >
                    {stats?.systemStatus === "online" ? (
                      <CheckCircle className="h-6 w-6 text-success-600" />
                    ) : stats?.systemStatus === "warning" ? (
                      <AlertTriangle className="h-6 w-6 text-warning-600" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-error-600" />
                    )}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600">Estado del Sistema</p>
                    <p className="text-lg font-bold capitalize text-secondary-900">
                      {stats?.systemStatus || "Desconocido"}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-secondary-600">Último Acceso</p>
                    <p className="text-sm font-bold text-secondary-900">Ahora</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">Información Personal</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Nombre</label>
                      <p className="text-secondary-900">{user.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Email</label>
                      <p className="text-secondary-900">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Roles</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {user.roles?.map((role) => (
                          <span key={role} className="px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-800">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-secondary-600">Estado</label>
                      <span className="ml-2 px-2 py-1 text-xs rounded-full bg-success-100 text-success-800">
                        Aprobado
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Services */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-4">Servicios Disponibles</h3>
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div
                        key={service.name}
                        className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
                      >
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{service.icon}</span>
                          <div>
                            <h4 className="font-medium text-secondary-900">{service.name}</h4>
                            <p className="text-sm text-secondary-600">{service.description}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(service.url, "_blank")}
                          className="flex items-center"
                        >
                          Acceder
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

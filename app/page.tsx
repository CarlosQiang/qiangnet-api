"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion, useScroll, useTransform } from "framer-motion"
import { Shield, ArrowRight, Play, Lock, Zap, Globe, CheckCircle } from "lucide-react"
import { Button } from "./components/ui/Button"
import { Card } from "./components/ui/Card"

interface User {
  id: string
  email: string
  name: string
  roles: string[]
}

interface AppSettings {
  siteName: string
  siteDescription: string
  logoUrl: string
  bgImage: string
  heroTitle: string
  heroSubtitle: string
  theme: any
  mainServices: Array<{
    name: string
    description: string
    url: string
    icon: string
    enabled: boolean
  }>
  additionalServices: Array<{
    name: string
    description: string
    url: string
    icon: string
    enabled: boolean
  }>
  animations: {
    enableParticles: boolean
    enableGradientAnimation: boolean
    enableFloatingElements: boolean
  }
}

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 300], [0, -50])
  const y2 = useTransform(scrollY, [0, 300], [0, -100])

  useEffect(() => {
    checkAuth()
    fetchSettings()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error("Error checking auth:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      // Configuración por defecto profesional
      setSettings({
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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <motion.div
          className="loading-spinner h-12 w-12"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        />
      </div>
    )
  }

  const enabledMainServices = settings?.mainServices?.filter((service) => service.enabled) || []
  const enabledAdditionalServices = settings?.additionalServices?.filter((service) => service.enabled) || []

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
          animate={{
            background: [
              "linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #0f172a 100%)",
              "linear-gradient(135deg, #1e293b 0%, #3b82f6 50%, #1e293b 100%)",
              "linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #0f172a 100%)",
            ],
          }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />

        {/* Floating Elements */}
        {settings?.animations?.enableFloatingElements && (
          <>
            <motion.div
              className="absolute top-20 left-10 w-4 h-4 bg-blue-400/30 rounded-full"
              animate={{
                y: [-20, 20, -20],
                x: [-10, 10, -10],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute top-40 right-20 w-6 h-6 bg-cyan-400/20 rounded-full"
              animate={{
                y: [20, -20, 20],
                x: [10, -10, 10],
                scale: [1.2, 1, 1.2],
              }}
              transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
            />
            <motion.div
              className="absolute bottom-40 left-20 w-3 h-3 bg-blue-300/40 rounded-full"
              animate={{
                y: [-15, 15, -15],
                x: [-5, 5, -5],
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 2 }}
            />
          </>
        )}

        {/* Gradient Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 12, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Shield className="h-6 w-6 text-white" />
              </motion.div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">{settings?.siteName || "QiangNet"}</h1>
            </motion.div>

            <motion.nav
              className="flex flex-wrap items-center justify-center gap-2 sm:gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {user ? (
                <>
                  <span className="text-white/80 text-sm sm:text-base">Hola, {user.name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/dashboard")}
                    className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                  >
                    Dashboard
                  </Button>
                  {user.roles?.includes("admin") && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => router.push("/admin")}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    >
                      Admin
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white/80 hover:bg-white/10">
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/login")}
                    className="text-white/80 hover:bg-white/10"
                  >
                    Iniciar Sesión
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push("/register")}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    Registrarse
                  </Button>
                </>
              )}
            </motion.nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="container mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <motion.div className="text-center max-w-5xl mx-auto" style={{ y: y1 }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="mb-8"
            >
              <motion.div
                className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Lock className="h-4 w-4 text-green-400 mr-2" />
                <span className="text-white/90 text-sm font-medium">Conexión Segura SSL</span>
                <CheckCircle className="h-4 w-4 text-green-400 ml-2" />
              </motion.div>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              {settings?.heroTitle?.split(" ").map((word, index) => (
                <motion.span
                  key={index}
                  className={
                    word.toLowerCase().includes("entretenimiento") || word.toLowerCase().includes("personal")
                      ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400"
                      : ""
                  }
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                >
                  {word}{" "}
                </motion.span>
              )) || "Tu Centro de Entretenimiento Personal"}
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl lg:text-2xl text-white/80 mb-8 leading-relaxed max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
            >
              {settings?.heroSubtitle ||
                "Accede a tu contenido multimedia favorito de forma segura y privada desde cualquier dispositivo"}
            </motion.p>

            {/* Trust Indicators */}
            <motion.div
              className="flex flex-wrap justify-center items-center gap-6 mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1 }}
            >
              <div className="flex items-center text-white/70">
                <Shield className="h-5 w-5 text-green-400 mr-2" />
                <span className="text-sm font-medium">Cifrado de Extremo a Extremo</span>
              </div>
              <div className="flex items-center text-white/70">
                <Zap className="h-5 w-5 text-yellow-400 mr-2" />
                <span className="text-sm font-medium">Acceso Instantáneo</span>
              </div>
              <div className="flex items-center text-white/70">
                <Globe className="h-5 w-5 text-blue-400 mr-2" />
                <span className="text-sm font-medium">Acceso Remoto Seguro</span>
              </div>
            </motion.div>

            {!user && (
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1.2 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    onClick={() => router.push("/register")}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 text-lg font-semibold shadow-xl"
                  >
                    Comenzar Ahora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => router.push("/login")}
                    className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm px-8 py-4 text-lg font-semibold"
                  >
                    Iniciar Sesión
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </section>

        {/* Main Services Section */}
        {enabledMainServices.length > 0 && (
          <motion.section
            className="container mx-auto px-4 sm:px-6 py-16"
            style={{ y: y2 }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Servicios Principales</h2>
              <p className="text-white/70 text-lg max-w-2xl mx-auto">
                Disfruta de tu contenido multimedia favorito con la máxima seguridad y calidad
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {enabledMainServices.map((service, index) => (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10 }}
                  className="group"
                >
                  <Card className="bg-white/10 backdrop-blur-md border-white/20 text-center h-full p-8 hover:bg-white/20 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-blue-500/20">
                    <motion.div
                      className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <span className="text-3xl">{service.icon}</span>
                    </motion.div>
                    <h3 className="text-2xl font-semibold text-white mb-4">{service.name}</h3>
                    <p className="text-white/70 mb-6 leading-relaxed">{service.description}</p>
                    {user ? (
                      <Button
                        variant="primary"
                        onClick={() => window.open(service.url, "_blank")}
                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 group-hover:shadow-lg"
                        size="lg"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Acceder Ahora
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={() => router.push("/login")}
                        className="w-full border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                        size="lg"
                      >
                        Iniciar Sesión para Acceder
                      </Button>
                    )}
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Additional Services for Logged Users */}
        {user && enabledAdditionalServices.length > 0 && (
          <motion.section
            className="container mx-auto px-4 sm:px-6 py-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Servicios Adicionales</h2>
              <p className="text-white/70 text-lg">Herramientas avanzadas para usuarios autenticados</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {enabledAdditionalServices.map((service, index) => (
                <motion.div
                  key={service.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10 }}
                  className="group"
                >
                  <Card className="bg-white/10 backdrop-blur-md border-white/20 text-center h-full p-8 hover:bg-white/20 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-cyan-500/20">
                    <motion.div
                      className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <span className="text-3xl">{service.icon}</span>
                    </motion.div>
                    <h3 className="text-2xl font-semibold text-white mb-4">{service.name}</h3>
                    <p className="text-white/70 mb-6 leading-relaxed">{service.description}</p>
                    <Button
                      variant="primary"
                      onClick={() => window.open(service.url, "_blank")}
                      className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 group-hover:shadow-lg"
                      size="lg"
                    >
                      Acceder
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Footer */}
        <footer className="relative z-10 bg-black/20 backdrop-blur-md border-t border-white/10 mt-20">
          <div className="container mx-auto px-4 sm:px-6 py-8">
            <div className="text-center">
              <p className="text-white/60 text-sm">
                © 2024 {settings?.siteName || "QiangNet"}. Todos los derechos reservados.
              </p>
              <p className="text-white/40 text-xs mt-2">Plataforma segura y privada para tu entretenimiento</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

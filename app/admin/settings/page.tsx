"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Save, Plus, Trash2, Eye, EyeOff, Palette, Settings, Shield, Zap } from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Card } from "../../components/ui/Card"

interface Service {
  name: string
  description: string
  url: string
  icon: string
  enabled: boolean
}

interface AppSettings {
  siteName: string
  siteDescription: string
  logoUrl: string
  bgImage: string
  heroTitle: string
  heroSubtitle: string
  theme: {
    primary: string
    secondary: string
    accent: string
  }
  allowRegistration: boolean
  requireApproval: boolean
  mainServices: Service[]
  additionalServices: Service[]
  animations: {
    enableParticles: boolean
    enableGradientAnimation: boolean
    enableFloatingElements: boolean
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        alert("Configuración guardada exitosamente")
      } else {
        alert("Error al guardar la configuración")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Error al guardar la configuración")
    } finally {
      setSaving(false)
    }
  }

  const addService = (type: "mainServices" | "additionalServices") => {
    if (!settings) return

    const newService: Service = {
      name: "",
      description: "",
      url: "",
      icon: "🔧",
      enabled: true,
    }

    setSettings({
      ...settings,
      [type]: [...settings[type], newService],
    })
  }

  const updateService = (
    type: "mainServices" | "additionalServices",
    index: number,
    field: keyof Service,
    value: any,
  ) => {
    if (!settings) return

    const services = [...settings[type]]
    services[index] = { ...services[index], [field]: value }

    setSettings({
      ...settings,
      [type]: services,
    })
  }

  const removeService = (type: "mainServices" | "additionalServices", index: number) => {
    if (!settings) return

    const services = settings[type].filter((_, i) => i !== index)
    setSettings({
      ...settings,
      [type]: services,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="loading-spinner h-12 w-12" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-white">Error al cargar la configuración</div>
      </div>
    )
  }

  const tabs = [
    { id: "general", name: "General", icon: Settings },
    { id: "theme", name: "Tema", icon: Palette },
    { id: "services", name: "Servicios", icon: Zap },
    { id: "security", name: "Seguridad", icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Configuración de la Aplicación</h1>
            <p className="text-white/70">Personaliza completamente tu plataforma sin tocar código</p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className="border-white/30 text-white hover:bg-white/10"
            >
              {previewMode ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {previewMode ? "Ocultar Vista Previa" : "Vista Previa"}
            </Button>
            <Button
              onClick={saveSettings}
              loading={saving}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-white/10 backdrop-blur-md rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white/20 text-white shadow-lg"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <div className="space-y-6">
            {activeTab === "general" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Información General</h3>
                  <div className="space-y-4">
                    <Input
                      label="Nombre del Sitio"
                      value={settings.siteName}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50"
                    />
                    <Input
                      label="Descripción del Sitio"
                      value={settings.siteDescription}
                      onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50"
                    />
                    <Input
                      label="Título del Hero"
                      value={settings.heroTitle}
                      onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50"
                    />
                    <Input
                      label="Subtítulo del Hero"
                      value={settings.heroSubtitle}
                      onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
                      className="bg-white/10 border-white/20 text-white placeholder-white/50"
                    />
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === "theme" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Colores del Tema</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">Color Primario</label>
                      <input
                        type="color"
                        value={settings.theme.primary}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            theme: { ...settings.theme, primary: e.target.value },
                          })
                        }
                        className="w-full h-12 rounded-lg border border-white/20 bg-white/10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">Color Secundario</label>
                      <input
                        type="color"
                        value={settings.theme.secondary}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            theme: { ...settings.theme, secondary: e.target.value },
                          })
                        }
                        className="w-full h-12 rounded-lg border border-white/20 bg-white/10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/90 mb-2">Color de Acento</label>
                      <input
                        type="color"
                        value={settings.theme.accent}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            theme: { ...settings.theme, accent: e.target.value },
                          })
                        }
                        className="w-full h-12 rounded-lg border border-white/20 bg-white/10"
                      />
                    </div>
                  </div>
                </Card>

                <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Animaciones</h3>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.animations.enableParticles}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            animations: { ...settings.animations, enableParticles: e.target.checked },
                          })
                        }
                        className="rounded border-white/20"
                      />
                      <span className="text-white">Habilitar Partículas</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.animations.enableGradientAnimation}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            animations: { ...settings.animations, enableGradientAnimation: e.target.checked },
                          })
                        }
                        className="rounded border-white/20"
                      />
                      <span className="text-white">Animación de Gradientes</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.animations.enableFloatingElements}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            animations: { ...settings.animations, enableFloatingElements: e.target.checked },
                          })
                        }
                        className="rounded border-white/20"
                      />
                      <span className="text-white">Elementos Flotantes</span>
                    </label>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === "services" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Servicios Principales */}
                <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">Servicios Principales</h3>
                    <Button
                      onClick={() => addService("mainServices")}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-cyan-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {settings.mainServices.map((service, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">Servicio {index + 1}</span>
                          <Button
                            onClick={() => removeService("mainServices", index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Nombre"
                            value={service.name}
                            onChange={(e) => updateService("mainServices", index, "name", e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder-white/50"
                          />
                          <Input
                            placeholder="Icono (emoji)"
                            value={service.icon}
                            onChange={(e) => updateService("mainServices", index, "icon", e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder-white/50"
                          />
                        </div>
                        <Input
                          placeholder="Descripción"
                          value={service.description}
                          onChange={(e) => updateService("mainServices", index, "description", e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder-white/50"
                        />
                        <Input
                          placeholder="URL"
                          value={service.url}
                          onChange={(e) => updateService("mainServices", index, "url", e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder-white/50"
                        />
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={service.enabled}
                            onChange={(e) => updateService("mainServices", index, "enabled", e.target.checked)}
                            className="rounded border-white/20"
                          />
                          <span className="text-white">Habilitado</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Servicios Adicionales */}
                <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-white">Servicios Adicionales</h3>
                    <Button
                      onClick={() => addService("additionalServices")}
                      size="sm"
                      className="bg-gradient-to-r from-slate-600 to-slate-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {settings.additionalServices.map((service, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-medium">Servicio {index + 1}</span>
                          <Button
                            onClick={() => removeService("additionalServices", index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Nombre"
                            value={service.name}
                            onChange={(e) => updateService("additionalServices", index, "name", e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder-white/50"
                          />
                          <Input
                            placeholder="Icono (emoji)"
                            value={service.icon}
                            onChange={(e) => updateService("additionalServices", index, "icon", e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder-white/50"
                          />
                        </div>
                        <Input
                          placeholder="Descripción"
                          value={service.description}
                          onChange={(e) => updateService("additionalServices", index, "description", e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder-white/50"
                        />
                        <Input
                          placeholder="URL"
                          value={service.url}
                          onChange={(e) => updateService("additionalServices", index, "url", e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder-white/50"
                        />
                        <label className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={service.enabled}
                            onChange={(e) => updateService("additionalServices", index, "enabled", e.target.checked)}
                            className="rounded border-white/20"
                          />
                          <span className="text-white">Habilitado</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Configuración de Seguridad</h3>
                  <div className="space-y-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.allowRegistration}
                        onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                        className="rounded border-white/20"
                      />
                      <span className="text-white">Permitir Registro de Nuevos Usuarios</span>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.requireApproval}
                        onChange={(e) => setSettings({ ...settings, requireApproval: e.target.checked })}
                        className="rounded border-white/20"
                      />
                      <span className="text-white">Requerir Aprobación Manual</span>
                    </label>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Preview Panel */}
          {previewMode && (
            <div className="lg:sticky lg:top-8">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Vista Previa</h3>
                <div className="bg-black/20 rounded-lg p-4 min-h-96">
                  <div className="text-center space-y-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg mx-auto flex items-center justify-center">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">{settings.siteName}</h1>
                    <h2 className="text-xl text-white">{settings.heroTitle}</h2>
                    <p className="text-white/70 text-sm">{settings.heroSubtitle}</p>
                    <div className="grid grid-cols-1 gap-4 mt-6">
                      {settings.mainServices
                        .filter((s) => s.enabled)
                        .slice(0, 2)
                        .map((service, index) => (
                          <div key={index} className="bg-white/10 rounded-lg p-3 text-center">
                            <div className="text-2xl mb-2">{service.icon}</div>
                            <div className="text-white font-medium text-sm">{service.name}</div>
                            <div className="text-white/60 text-xs">{service.description}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Shield, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "../components/ui/Button"
import { Input } from "../components/ui/Input"
import { Card } from "../components/ui/Card"
import { validateEmail, validatePassword } from "@/lib/utils"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido"
    }

    if (!validateEmail(formData.email)) {
      newErrors.email = "Email inválido"
    }

    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.errors[0]
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        setErrors({ general: data.error || "Error al registrarse" })
      }
    } catch (error) {
      setErrors({ general: "Error de conexión" })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-primary-900 flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-effect border-white/20 text-center p-6 sm:p-8">
            <div className="w-16 h-16 bg-success-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-4">¡Registro Exitoso!</h1>
            <p className="text-white/70 mb-6 text-sm sm:text-base">
              Tu cuenta ha sido creada y está pendiente de aprobación por un administrador.
            </p>
            <Button onClick={() => router.push("/login")} className="w-full bg-primary-600 hover:bg-primary-700">
              Ir al Login
            </Button>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-primary-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-hero-pattern opacity-5" />

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Card className="glass-effect border-white/20 p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <motion.div
              className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Shield className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Crear Cuenta</h1>
            <p className="text-white/70 text-sm sm:text-base">Únete a la plataforma segura</p>
          </div>

          {errors.general && (
            <motion.div
              className="bg-error-500/20 border border-error-500/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-start"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-error-400 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-error-200 text-sm sm:text-base">{errors.general}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Input
                label="Nombre completo"
                type="text"
                placeholder="Tu nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
                error={errors.name}
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Input
                label="Email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
                error={errors.email}
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Input
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
                error={errors.password}
                showPasswordToggle
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Input
                label="Confirmar contraseña"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
                error={errors.confirmPassword}
                showPasswordToggle
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Button
                type="submit"
                loading={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white text-sm sm:text-base"
                size="lg"
              >
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </motion.div>
          </form>

          <motion.div
            className="text-center mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <p className="text-white/70 text-sm sm:text-base">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-primary-400 hover:text-primary-300 font-semibold">
                Inicia sesión
              </Link>
            </p>
          </motion.div>
        </Card>

        <motion.div
          className="text-center mt-4 sm:mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <Link href="/" className="text-white/60 hover:text-white/80 text-sm">
            ← Volver al inicio
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

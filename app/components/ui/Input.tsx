"use client"

import type React from "react"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  showPasswordToggle?: boolean
}

export function Input({ label, error, showPasswordToggle, className = "", type, ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [inputType, setInputType] = useState(type)

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
    setInputType(showPassword ? "password" : "text")
  }

  // Determinar el autocomplete apropiado
  const getAutoComplete = () => {
    if (props.autoComplete) return props.autoComplete

    if (type === "email") return "email"
    if (type === "password") {
      if (props.name === "confirmPassword" || props.placeholder?.includes("confirmar")) {
        return "new-password"
      }
      if (props.name === "password" && window.location.pathname.includes("register")) {
        return "new-password"
      }
      return "current-password"
    }
    if (props.name === "name" || label?.toLowerCase().includes("nombre")) return "name"

    return "off"
  }

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-white/90">{label}</label>}
      <div className="relative">
        <input
          {...props}
          type={inputType}
          autoComplete={getAutoComplete()}
          className={`
            input-field w-full px-4 py-3 rounded-lg border transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500
            ${showPasswordToggle ? "pr-12" : ""}
            ${error ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/50" : ""}
            ${className}
          `}
        />
        {showPasswordToggle && type === "password" && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}

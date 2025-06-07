"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface AppSettings {
  logoUrl: string
  bgImage: string
  siteName: string
  theme: {
    primary?: string
    secondary?: string
    background?: string
    text?: string
  }
}

interface ThemeContextType {
  settings: AppSettings | null
  updateSettings: (settings: AppSettings) => void
  loading: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  settings: null,
  updateSettings: () => {},
  loading: true,
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    if (settings?.theme) {
      const root = document.documentElement
      if (settings.theme.primary) root.style.setProperty("--color-primary", settings.theme.primary)
      if (settings.theme.secondary) root.style.setProperty("--color-secondary", settings.theme.secondary)
      if (settings.theme.background) root.style.setProperty("--color-background", settings.theme.background)
      if (settings.theme.text) root.style.setProperty("--color-text", settings.theme.text)
    }
  }, [settings])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings")
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

  const updateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings)
  }

  return <ThemeContext.Provider value={{ settings, updateSettings, loading }}>{children}</ThemeContext.Provider>
}

"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Locale = "en" | "kn" | "hi"

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  translations: Record<string, any>
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")
  const [translations, setTranslations] = useState<Record<string, any>>({})
  const [mounted, setMounted] = useState(false)

  // Load translations
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/locales/${locale}/common.json`)
        if (!response.ok) {
          throw new Error(`Failed to fetch translations: ${response.statusText}`)
        }
        const data = await response.json()
        setTranslations(data)
        console.log(`[v0] Loaded ${locale} translations successfully`)
      } catch (error) {
        console.error(`[v0] Failed to load translations for ${locale}:`, error)
        // Set default English translations as fallback
        if (locale !== "en") {
          try {
            const fallbackResponse = await fetch(`/locales/en/common.json`)
            const fallbackData = await fallbackResponse.json()
            setTranslations(fallbackData)
          } catch (fallbackError) {
            console.error("[v0] Failed to load fallback translations:", fallbackError)
          }
        }
      }
    }

    if (mounted) {
      loadTranslations()
    }
  }, [locale, mounted])

  useEffect(() => {
    setMounted(true)
    const savedLocale = localStorage.getItem("appLanguage") as Locale | null
    if (savedLocale && ["en", "kn", "hi"].includes(savedLocale)) {
      setLocaleState(savedLocale)
      console.log(`[v0] Restored language preference: ${savedLocale}`)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    console.log(`[v0] Changing language to: ${newLocale}`)
    setLocaleState(newLocale)
    localStorage.setItem("appLanguage", newLocale)

    // Update HTML lang attribute
    if (typeof document !== "undefined") {
      document.documentElement.lang = newLocale
    }
  }

  // Translation function with nested key support
  const t = (key: string): string => {
    const keys = key.split(".")
    let value: any = translations

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k]
      } else {
        // Return key if translation not found
        return key
      }
    }

    return typeof value === "string" ? value : key
  }

  return <I18nContext.Provider value={{ locale, setLocale, t, translations }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider")
  }
  return context
}

// Language metadata
export const languages = {
  en: { name: "English", nativeName: "English" },
  kn: { name: "Kannada", nativeName: "ಕನ್ನಡ" },
  hi: { name: "Hindi", nativeName: "हिन्दी" },
}

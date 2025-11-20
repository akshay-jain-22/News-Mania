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

  // Load translations
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/locales/${locale}/common.json`)
        const data = await response.json()
        setTranslations(data)
      } catch (error) {
        console.error(`Failed to load translations for ${locale}:`, error)
      }
    }

    loadTranslations()
  }, [locale])

  // Load saved language preference on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") as Locale | null
    if (savedLocale && ["en", "kn", "hi"].includes(savedLocale)) {
      setLocaleState(savedLocale)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem("locale", newLocale)

    // Update HTML lang attribute
    document.documentElement.lang = newLocale
  }

  // Translation function with nested key support
  const t = (key: string): string => {
    const keys = key.split(".")
    let value: any = translations

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k]
      } else {
        return key // Return key if translation not found
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

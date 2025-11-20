"use client"

import { useEffect, useState } from "react"
import { Languages, Check } from "lucide-react"
import { useI18n } from "@/lib/i18n"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="outline" size="icon" disabled>
        <Languages className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Change language</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Change language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLocale("en")} className={locale === "en" ? "bg-accent" : ""}>
          <span className="flex items-center justify-between w-full">
            English
            {locale === "en" && <Check className="h-4 w-4 ml-2" />}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale("kn")} className={locale === "kn" ? "bg-accent" : ""}>
          <span className="flex items-center justify-between w-full">
            ಕನ್ನಡ
            {locale === "kn" && <Check className="h-4 w-4 ml-2" />}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLocale("hi")} className={locale === "hi" ? "bg-accent" : ""}>
          <span className="flex items-center justify-between w-full">
            हिन्दी
            {locale === "hi" && <Check className="h-4 w-4 ml-2" />}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

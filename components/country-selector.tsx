"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe } from "lucide-react"
import { useI18n } from "@/lib/i18n"

interface CountrySelectorProps {
  value: string
  onValueChange: (value: string) => void
}

const SUPPORTED_COUNTRIES = [
  { code: "in", name: "India", nativeName: "भारत" },
  { code: "us", name: "United States", nativeName: "USA" },
  { code: "gb", name: "United Kingdom", nativeName: "UK" },
  { code: "au", name: "Australia", nativeName: "Australia" },
  { code: "ca", name: "Canada", nativeName: "Canada" },
]

export function CountrySelector({ value, onValueChange }: CountrySelectorProps) {
  const { t } = useI18n()

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <Globe className="h-4 w-4 mr-2" />
        <SelectValue placeholder={t("selectCountry")} />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_COUNTRIES.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            {country.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

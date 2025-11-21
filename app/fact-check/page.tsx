"use client"

import { GrokConnectionTest } from "@/components/grok-connection-test"
import { useI18n } from "@/lib/i18n"

export default function FactCheckPage() {
  const { t } = useI18n()

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">{t("factCheck.title")}</h1>

      <div className="mb-8">
        <GrokConnectionTest />
      </div>

      <p className="mb-4">{t("factCheck.verifyNews")}</p>
      {/* Add more content here as needed */}
    </div>
  )
}

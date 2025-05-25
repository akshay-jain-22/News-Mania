"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useAutoRefresh } from "@/components/auto-refresh-provider"

export function RefreshButton() {
  const { lastRefresh, refreshing, triggerRefresh } = useAutoRefresh()

  return (
    <Button
      variant="outline"
      onClick={() => triggerRefresh()}
      disabled={refreshing}
      className="flex items-center gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
      <span className="hidden sm:inline">Refresh</span>
    </Button>
  )
}

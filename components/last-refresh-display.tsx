"use client"

import { useAutoRefresh } from "@/components/auto-refresh-provider"

export function LastRefreshDisplay() {
  const { lastRefresh } = useAutoRefresh()

  if (!lastRefresh) return null

  return <p className="text-xs text-muted-foreground ml-2">Last updated: {lastRefresh.toLocaleTimeString()}</p>
}

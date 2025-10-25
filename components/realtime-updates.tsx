"use client"

import { useState } from "react"
import { useWebSocket, type WebSocketMessage } from "@/hooks/use-websocket"
import { useAuth } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"

export function RealtimeUpdates() {
  const { user } = useAuth()
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [updateCount, setUpdateCount] = useState(0)

  const handleMessage = (message: WebSocketMessage) => {
    console.log("[v0] Received WebSocket message:", message.type)

    switch (message.type) {
      case "recommendation_update":
        console.log("[v0] Recommendation update:", message.data)
        setLastUpdate(`Recommendations updated at ${new Date().toLocaleTimeString()}`)
        setUpdateCount((c) => c + 1)
        // Trigger UI update for recommendations
        window.dispatchEvent(
          new CustomEvent("recommendationUpdate", {
            detail: message.data,
          }),
        )
        break

      case "credibility_update":
        console.log("[v0] Credibility update:", message.data)
        setLastUpdate(`Credibility scores updated at ${new Date().toLocaleTimeString()}`)
        setUpdateCount((c) => c + 1)
        // Trigger UI update for credibility badges
        window.dispatchEvent(
          new CustomEvent("credibilityUpdate", {
            detail: message.data,
          }),
        )
        break

      case "methodology_update":
        console.log("[v0] Methodology update:", message.data)
        setLastUpdate(`Methodology updated at ${new Date().toLocaleTimeString()}`)
        break

      case "dashboard_metrics":
        console.log("[v0] Dashboard metrics:", message.data)
        // Trigger dashboard refresh
        window.dispatchEvent(
          new CustomEvent("dashboardMetricsUpdate", {
            detail: message.data,
          }),
        )
        break
    }
  }

  const { isConnected } = useWebSocket(handleMessage)

  if (!user) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2">
        <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
          {isConnected ? "Live" : "Offline"}
        </Badge>
        {lastUpdate && <span className="text-xs text-gray-500">{lastUpdate}</span>}
      </div>
    </div>
  )
}

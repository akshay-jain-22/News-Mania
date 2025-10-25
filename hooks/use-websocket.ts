"use client"

import { useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/lib/auth"

export interface WebSocketMessage {
  type: "recommendation_update" | "credibility_update" | "methodology_update" | "dashboard_metrics"
  data: any
  timestamp: string
}

export function useWebSocket(onMessage: (message: WebSocketMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const { user } = useAuth()
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = useCallback(() => {
    if (!user?.id) return

    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
      const wsUrl = `${protocol}//${window.location.host}/api/ws`

      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log("[v0] WebSocket connected")
        // Send auth token
        ws.send(
          JSON.stringify({
            type: "auth",
            token: localStorage.getItem("accessToken"),
          }),
        )
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage
          onMessage(message)
        } catch (error) {
          console.error("[v0] Error parsing WebSocket message:", error)
        }
      }

      ws.onerror = (error) => {
        console.error("[v0] WebSocket error:", error)
      }

      ws.onclose = () => {
        console.log("[v0] WebSocket disconnected")
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 3000)
      }

      wsRef.current = ws
    } catch (error) {
      console.error("[v0] Error connecting to WebSocket:", error)
    }
  }, [user?.id, onMessage])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [connect])

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    send: (data: any) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(data))
      }
    },
  }
}

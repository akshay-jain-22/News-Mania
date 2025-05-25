"use client"

import type React from "react"

import { useEffect, useState, createContext, useContext } from "react"
import { setupNewsRefresh } from "@/lib/news-api"
import { useToast } from "@/components/ui/use-toast"

// Create a context to track the last refresh time
const AutoRefreshContext = createContext<{
  lastRefresh: Date | null
  refreshing: boolean
  triggerRefresh: () => Promise<void>
}>({
  lastRefresh: null,
  refreshing: false,
  triggerRefresh: async () => {},
})

export const useAutoRefresh = () => useContext(AutoRefreshContext)

export function AutoRefreshProvider({ children }: { children: React.ReactNode }) {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  const triggerRefresh = async () => {
    if (refreshing) return

    setRefreshing(true)
    try {
      await setupNewsRefresh()
      setLastRefresh(new Date())
      toast({
        title: "News refreshed",
        description: "The latest news has been loaded.",
      })
    } catch (error) {
      console.error("Error refreshing news:", error)
      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "There was an error refreshing the news. Please try again.",
      })
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // Initial refresh when the app loads
    const initialRefresh = async () => {
      try {
        await triggerRefresh()
      } catch (error) {
        console.error("Initial refresh error:", error)
      }
    }

    initialRefresh()

    // Set up automatic refresh every hour (3600000 ms)
    const refreshInterval = setInterval(() => {
      console.log("Hourly refresh triggered at:", new Date().toLocaleTimeString())
      triggerRefresh()
    }, 3600000) // 1 hour

    return () => clearInterval(refreshInterval)
  }, [])

  return (
    <AutoRefreshContext.Provider value={{ lastRefresh, refreshing, triggerRefresh }}>
      {children}
    </AutoRefreshContext.Provider>
  )
}

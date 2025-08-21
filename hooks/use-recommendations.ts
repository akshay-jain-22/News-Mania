"use client"

import { useState, useEffect, useCallback } from "react"
import type { PersonalizedFeed } from "@/types/recommendations"

export function useRecommendations(userId: string | null) {
  const [personalizedFeed, setPersonalizedFeed] = useState<PersonalizedFeed | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPersonalizedFeed = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/personalized-feed?userId=${userId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch personalized feed")
      }

      const feed = await response.json()
      setPersonalizedFeed(feed)
    } catch (err) {
      console.error("Error fetching personalized feed:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [userId])

  const trackInteraction = useCallback(
    async (action: string, articleId: string, timeSpent?: number) => {
      if (!userId) return

      try {
        await fetch("/api/recommendations", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            action,
            articleId,
            timeSpent,
          }),
        })
      } catch (err) {
        console.error("Error tracking interaction:", err)
      }
    },
    [userId],
  )

  useEffect(() => {
    if (userId) {
      fetchPersonalizedFeed()
    }
  }, [userId, fetchPersonalizedFeed])

  return {
    personalizedFeed,
    loading,
    error,
    fetchPersonalizedFeed,
    trackInteraction,
  }
}

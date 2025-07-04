"use client"

import { useState, useEffect } from "react"
import type { RecommendationResult, PersonalizedFeed } from "@/types/recommendations"

export function useRecommendations(userId: string | null) {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([])
  const [personalizedFeed, setPersonalizedFeed] = useState<PersonalizedFeed | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecommendations = async (options?: {
    maxResults?: number
    categories?: string[]
    excludeRead?: boolean
  }) => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        userId,
        maxResults: (options?.maxResults || 10).toString(),
        excludeRead: (options?.excludeRead || true).toString(),
      })

      if (options?.categories) {
        params.append("categories", options.categories.join(","))
      }

      const response = await fetch(`/api/recommendations?${params}`)

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations")
      }

      const data = await response.json()
      setRecommendations(data.recommendations)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const fetchPersonalizedFeed = async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/personalized-feed?userId=${userId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch personalized feed")
      }

      const data = await response.json()
      setPersonalizedFeed(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const trackInteraction = async (action: string, articleId: string, timeSpent?: number) => {
    if (!userId) return

    try {
      await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          action,
          articleId,
          timeSpent,
        }),
      })
    } catch (err) {
      console.error("Failed to track interaction:", err)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchRecommendations()
      fetchPersonalizedFeed()
    }
  }, [userId])

  return {
    recommendations,
    personalizedFeed,
    loading,
    error,
    fetchRecommendations,
    fetchPersonalizedFeed,
    trackInteraction,
  }
}

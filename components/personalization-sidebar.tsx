"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

interface Recommendation {
  articleId: string
  score: number
  reason: string
}

interface PersonalizationSidebarProps {
  userId: string
}

export function PersonalizationSidebar({ userId }: PersonalizationSidebarProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch("/api/ml/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, limit: 5 }),
        })

        if (response.ok) {
          const data = await response.json()
          setRecommendations(data.recommendations || [])
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [userId])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-4 w-4 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recommended For You</CardTitle>
        <CardDescription>Based on your reading habits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No personalized recommendations yet. Start reading to see recommendations!
          </p>
        ) : (
          recommendations.map((rec) => (
            <div key={rec.articleId} className="rounded-md border border-slate-200 p-3">
              <p className="text-xs font-medium text-slate-600 mb-1">{rec.reason}</p>
              <p className="text-sm font-medium text-slate-900 line-clamp-2">Article {rec.articleId}</p>
              <div className="mt-2 flex gap-1">
                <Badge variant="secondary" className="text-xs">
                  Score: {(rec.score * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

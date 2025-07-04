"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useRecommendations } from "@/hooks/use-recommendations"
import { Brain, Database, TrendingUp, User, Eye, EyeOff } from "lucide-react"

interface RecommendationDebugProps {
  userId: string
}

export function RecommendationDebug({ userId }: RecommendationDebugProps) {
  const [showDebug, setShowDebug] = useState(false)
  const { recommendations, personalizedFeed } = useRecommendations(userId)

  if (!showDebug) {
    return (
      <Button onClick={() => setShowDebug(true)} variant="outline" size="sm" className="fixed bottom-4 right-4 z-50">
        <Brain className="h-4 w-4 mr-2" />
        Debug AI
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto z-50">
      <Card className="bg-white shadow-lg border-2 border-blue-200">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Recommendation Debug
            </CardTitle>
            <Button onClick={() => setShowDebug(false)} variant="ghost" size="sm">
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          {/* User Profile Summary */}
          <div className="p-2 bg-blue-50 rounded">
            <div className="flex items-center gap-1 mb-1">
              <User className="h-3 w-3" />
              <span className="font-medium">User Profile</span>
            </div>
            <div className="space-y-1">
              <div>ID: {userId}</div>
              <div>Feed Type: {personalizedFeed?.feedType || "Unknown"}</div>
              <div>Recommendations: {recommendations.length}</div>
            </div>
          </div>

          {/* Recommendation Scores */}
          {recommendations.length > 0 && (
            <div className="p-2 bg-green-50 rounded">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3" />
                <span className="font-medium">Top Recommendations</span>
              </div>
              <div className="space-y-1">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <div key={rec.articleId} className="flex justify-between items-center">
                    <span>#{index + 1}</span>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(rec.score * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Algorithm Info */}
          <div className="p-2 bg-purple-50 rounded">
            <div className="flex items-center gap-1 mb-1">
              <Database className="h-3 w-3" />
              <span className="font-medium">Algorithm</span>
            </div>
            <div className="space-y-1">
              <div>Embeddings: OpenAI text-embedding-3-small</div>
              <div>Similarity: Cosine similarity</div>
              <div>Factors: Semantic (40%), Category (25%), Recency (20%)</div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="p-2 bg-yellow-50 rounded">
            <div className="flex items-center gap-1 mb-1">
              <Eye className="h-3 w-3" />
              <span className="font-medium">Performance</span>
            </div>
            <div className="space-y-1">
              <div>
                Avg Score:{" "}
                {recommendations.length > 0
                  ? Math.round((recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length) * 100)
                  : 0}
                %
              </div>
              <div>Categories: {new Set(recommendations.map((r) => r.category)).size}</div>
              <div>
                Last Update:{" "}
                {personalizedFeed?.lastUpdated ? new Date(personalizedFeed.lastUpdated).toLocaleTimeString() : "Never"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

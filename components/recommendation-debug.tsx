"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Bug, Brain, Target, TrendingUp } from "lucide-react"
import type { PersonalizedFeed } from "@/types/recommendations"

interface RecommendationDebugProps {
  personalizedFeed: PersonalizedFeed | null
  userId: string
}

export function RecommendationDebug({ personalizedFeed, userId }: RecommendationDebugProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!personalizedFeed) return null

  return (
    <Card className="border-orange-200 bg-orange-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-orange-100 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="h-5 w-5 text-orange-600" />
                <span className="text-orange-800">AI Recommendation Debug</span>
                <Badge variant="outline" className="text-xs">
                  DEV MODE
                </Badge>
              </div>
              <ChevronDown className={`h-4 w-4 text-orange-600 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* User Profile Debug */}
            <div className="p-3 bg-white rounded border">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4" />
                User Profile Analysis
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">User ID:</span> {userId}
                </div>
                <div>
                  <span className="font-medium">Feed Type:</span> {personalizedFeed.feedType}
                </div>
                <div>
                  <span className="font-medium">Recommendations:</span> {personalizedFeed.recommendations.length}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>{" "}
                  {new Date(personalizedFeed.lastUpdated).toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Recommendation Scores */}
            <div className="p-3 bg-white rounded border">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Target className="h-4 w-4" />
                Recommendation Scores
              </h4>
              <div className="space-y-2">
                {personalizedFeed.recommendations.slice(0, 5).map((rec, index) => (
                  <div key={rec.articleId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="text-sm font-medium">Article #{index + 1}</div>
                      <div className="text-xs text-gray-600">{rec.reason}</div>
                      <div className="text-xs text-gray-500">Category: {rec.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{Math.round(rec.score * 100)}%</div>
                      <div className="text-xs text-gray-500">Confidence: {Math.round(rec.confidence * 100)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Algorithm Insights */}
            <div className="p-3 bg-white rounded border">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4" />
                Algorithm Insights
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="p-2 bg-blue-50 rounded">
                  <div className="font-medium text-blue-800">Semantic Similarity</div>
                  <div className="text-blue-600">40% weight in scoring</div>
                  <div className="text-xs text-blue-500">Based on content embeddings</div>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <div className="font-medium text-green-800">Category Preference</div>
                  <div className="text-green-600">25% weight in scoring</div>
                  <div className="text-xs text-green-500">User's preferred topics</div>
                </div>
                <div className="p-2 bg-yellow-50 rounded">
                  <div className="font-medium text-yellow-800">Recency Score</div>
                  <div className="text-yellow-600">20% weight in scoring</div>
                  <div className="text-xs text-yellow-500">How fresh the content is</div>
                </div>
                <div className="p-2 bg-purple-50 rounded">
                  <div className="font-medium text-purple-800">Popularity & Diversity</div>
                  <div className="text-purple-600">15% weight in scoring</div>
                  <div className="text-xs text-purple-500">Trending + variety factors</div>
                </div>
              </div>
            </div>

            {/* Personalization Message Debug */}
            <div className="p-3 bg-white rounded border">
              <h4 className="font-semibold mb-2">Generated Message</h4>
              <div className="p-2 bg-gray-100 rounded text-sm italic">"{personalizedFeed.personalizedMessage}"</div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

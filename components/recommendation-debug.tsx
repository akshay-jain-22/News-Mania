"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Bug, User, Clock, TrendingUp } from "lucide-react"

interface RecommendationDebugProps {
  userId: string
  personalizedFeed: any
}

export function RecommendationDebug({ userId, personalizedFeed }: RecommendationDebugProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)

  useEffect(() => {
    if (userId) {
      fetchDebugData()
    }
  }, [userId])

  const fetchDebugData = async () => {
    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, maxResults: 5 }),
      })

      if (response.ok) {
        const data = await response.json()
        setDebugData(data)
      }
    } catch (error) {
      console.error("Error fetching debug data:", error)
    }
  }

  if (!debugData) return null

  return (
    <Card className="border-orange-200 bg-orange-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-orange-100 transition-colors">
            <CardTitle className="flex items-center justify-between text-orange-800">
              <div className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                AI Recommendation Debug Panel
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* User Profile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User Profile
                </h4>
                <div className="text-sm space-y-1">
                  <p>
                    <strong>User ID:</strong> {debugData.userProfile.userId}
                  </p>
                  <p>
                    <strong>Articles Read:</strong> {debugData.userProfile.totalReadArticles}
                  </p>
                  <p>
                    <strong>Preferred Categories:</strong>
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {debugData.userProfile.preferredCategories.map((category: string) => (
                      <Badge key={category} variant="outline" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time Analytics
                </h4>
                <div className="text-sm space-y-1">
                  {Object.entries(debugData.userProfile.analytics || {}).map(([category, time]) => (
                    <div key={category} className="flex justify-between">
                      <span>{category}:</span>
                      <span>
                        {Math.round(Number(time) / 60)}m {Number(time) % 60}s
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Top Recommendations
              </h4>
              <div className="space-y-2">
                {debugData.recommendations.slice(0, 3).map((rec: any, index: number) => (
                  <div key={rec.articleId} className="p-3 bg-white rounded border text-sm">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary">#{index + 1}</Badge>
                      <div className="text-right">
                        <div className="font-semibold">{Math.round(rec.score * 100)}%</div>
                        <div className="text-xs text-gray-500">match</div>
                      </div>
                    </div>
                    <p>
                      <strong>Article:</strong> {rec.articleId}
                    </p>
                    <p>
                      <strong>Category:</strong> {rec.category}
                    </p>
                    <p>
                      <strong>Reason:</strong> {rec.reason}
                    </p>
                    <p>
                      <strong>Confidence:</strong> {Math.round(rec.confidence * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={fetchDebugData} variant="outline" size="sm">
              Refresh Debug Data
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, Bug, Database, Brain, Activity } from "lucide-react"
import type { PersonalizedFeed } from "@/types/recommendations"

interface RecommendationDebugProps {
  personalizedFeed: PersonalizedFeed | null
  userId: string
}

export function RecommendationDebug({ personalizedFeed, userId }: RecommendationDebugProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)

  useEffect(() => {
    if (personalizedFeed) {
      setDebugData({
        userId,
        feedType: personalizedFeed.feedType,
        articleCount: personalizedFeed.recommendations?.length || 0,
        lastUpdated: personalizedFeed.lastUpdated,
        personalizedMessage: personalizedFeed.personalizedMessage,
        recommendations: personalizedFeed.recommendations?.slice(0, 3) || [],
      })
    }
  }, [personalizedFeed, userId])

  if (!debugData) {
    return null
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-orange-100 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Bug className="h-5 w-5" />
                Debug Panel (Development)
              </CardTitle>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  User Data
                </h4>
                <div className="text-sm space-y-1">
                  <div>
                    User ID: <code className="bg-white px-1 rounded">{debugData.userId}</code>
                  </div>
                  <div>
                    Feed Type: <Badge variant="outline">{debugData.feedType}</Badge>
                  </div>
                  <div>Articles: {debugData.articleCount}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  System Status
                </h4>
                <div className="text-sm space-y-1">
                  <div>Last Updated: {new Date(debugData.lastUpdated).toLocaleString()}</div>
                  <div>
                    API Status: <Badge variant="default">NewsAPI Only</Badge>
                  </div>
                  <div>
                    Fallback Data: <Badge variant="destructive">Disabled</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Personalization
              </h4>
              <div className="text-sm">
                <div className="bg-white p-2 rounded border">
                  <strong>Message:</strong> {debugData.personalizedMessage}
                </div>
              </div>
            </div>

            {debugData.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Top Recommendations</h4>
                <div className="space-y-2">
                  {debugData.recommendations.map((rec: any, index: number) => (
                    <div key={index} className="bg-white p-2 rounded border text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <div>
                            <strong>Article:</strong> {rec.articleId}
                          </div>
                          <div>
                            <strong>Reason:</strong> {rec.reason}
                          </div>
                          <div>
                            <strong>Category:</strong> {rec.category}
                          </div>
                        </div>
                        <div className="text-right">
                          <div>
                            <strong>Score:</strong> {Math.round(rec.score * 100)}%
                          </div>
                          <div>
                            <strong>Confidence:</strong> {Math.round((rec.confidence || 0) * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t">
              <p className="text-xs text-orange-600">
                This debug panel shows the AI recommendation engine's decision-making process using real NewsAPI data.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

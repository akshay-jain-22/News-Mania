"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDistanceToNow } from "@/lib/utils"
import type { NewsArticle } from "@/types/news"
import {
  Clock,
  Bookmark,
  MessageSquare,
  Share2,
  Shield,
  Brain,
  Sparkles,
  RefreshCw,
  Loader2,
  BarChart3,
  Zap,
} from "lucide-react"

interface MLPersonalizedFeedProps {
  userId: string
}

export function MLPersonalizedFeed({ userId }: MLPersonalizedFeedProps) {
  const [recommendations, setRecommendations] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [insights, setInsights] = useState<any>(null)

  useEffect(() => {
    loadMLRecommendations()
    loadUserInsights()
  }, [userId])

  const loadMLRecommendations = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🤖 Loading ML-powered recommendations...")

      const response = await fetch(`/api/ml-recommendations?userId=${userId}&maxResults=12`)

      if (!response.ok) {
        throw new Error("Failed to load recommendations")
      }

      const data = await response.json()
      setRecommendations(data.recommendations || [])

      console.log(`✨ Loaded ${data.recommendations?.length || 0} ML recommendations`)
    } catch (error) {
      console.error("Error loading ML recommendations:", error)
      setError("Unable to load personalized recommendations. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const loadUserInsights = async () => {
    try {
      const response = await fetch(`/api/user-insights?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setInsights(data)
      }
    } catch (error) {
      console.error("Error loading user insights:", error)
    }
  }

  const trackInteraction = async (articleId: string, interactionType: string, timeSpent?: number) => {
    try {
      await fetch("/api/track-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          articleId,
          interactionType,
          timeSpent: timeSpent || 0,
          scrollDepth: 0.5,
        }),
      })
    } catch (error) {
      console.error("Error tracking interaction:", error)
    }
  }

  const handleArticleClick = (article: NewsArticle) => {
    trackInteraction(article.id, "click")
    setTimeout(() => trackInteraction(article.id, "view", 30), 1000)
  }

  const handleSave = (article: NewsArticle) => {
    trackInteraction(article.id, "save")
  }

  const handleShare = (article: NewsArticle) => {
    trackInteraction(article.id, "share")
  }

  const refreshRecommendations = async () => {
    setRefreshing(true)
    try {
      await loadMLRecommendations()
      await loadUserInsights()
    } finally {
      setRefreshing(false)
    }
  }

  const renderCredibilityBadge = (score: number) => {
    if (score >= 85) {
      return (
        <Badge className="bg-green-600 text-white text-xs">
          <Shield className="h-3 w-3 mr-1" />
          {score}%
        </Badge>
      )
    } else if (score >= 70) {
      return (
        <Badge className="bg-yellow-600 text-white text-xs">
          <Shield className="h-3 w-3 mr-1" />
          {score}%
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-red-600 text-white text-xs">
          <Shield className="h-3 w-3 mr-1" />
          {score}%
        </Badge>
      )
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Brain className="h-12 w-12 animate-pulse mx-auto mb-4 text-purple-500" />
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">AI is personalizing your news feed...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert className="bg-red-900/20 border-red-600">
          <AlertDescription className="text-red-200">{error}</AlertDescription>
        </Alert>
      )}

      {/* ML Personalization Header */}
      <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-full">
                <Brain className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Zap className="h-6 w-6 text-yellow-400" />
                  AI-Powered Personalization
                </h2>
                <p className="text-purple-200">Machine learning curated just for you</p>
              </div>
            </div>
            <Button
              onClick={refreshRecommendations}
              disabled={refreshing}
              variant="outline"
              className="border-purple-500 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Learning..." : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Insights Dashboard */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Your Reading Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500">{insights.totalInteractions}</div>
                <div className="text-sm text-muted-foreground">Total Interactions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500">{Math.round(insights.engagementScore)}</div>
                <div className="text-sm text-muted-foreground">Engagement Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-500">
                  {Math.round(insights.readingPatterns?.averageReadTime || 0)}s
                </div>
                <div className="text-sm text-muted-foreground">Avg Read Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">{insights.readingPatterns?.consistency || 0}%</div>
                <div className="text-sm text-muted-foreground">Consistency</div>
              </div>
            </div>

            {insights.topCategories?.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Your Top Interests</h4>
                <div className="flex flex-wrap gap-2">
                  {insights.topCategories.slice(0, 5).map(([category, weight]: [string, number]) => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category} ({Math.round(weight * 10)})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ML Recommendations Grid */}
      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((article, index) => (
            <Card
              key={article.id}
              className="bg-card border-border overflow-hidden group hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10"
            >
              <Link
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleArticleClick(article)}
              >
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={article.urlToImage || "/placeholder.svg?height=200&width=300"}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-purple-600 text-white text-xs">
                      <Brain className="h-3 w-3 mr-1" />#{index + 1} AI Pick
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-background/80 backdrop-blur-sm text-foreground text-xs">
                      {article.source.name}
                    </Badge>
                  </div>
                  {article.credibilityScore && (
                    <div className="absolute bottom-2 right-2">{renderCredibilityBadge(article.credibilityScore)}</div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-sm mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                    {(article as any).personalizedHeadline || article.title}
                  </h3>
                  <p className="text-muted-foreground text-xs mb-3 line-clamp-2">{article.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(article.publishedAt))} ago
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className="text-muted-foreground hover:text-purple-400"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                      >
                        <MessageSquare className="h-3 w-3" />
                      </button>
                      <button
                        className="text-muted-foreground hover:text-purple-400"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleSave(article)
                        }}
                      >
                        <Bookmark className="h-3 w-3" />
                      </button>
                      <button
                        className="text-muted-foreground hover:text-purple-400"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleShare(article)
                        }}
                      >
                        <Share2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Building Your AI Profile</h3>
            <p className="text-muted-foreground mb-4">
              Start reading articles to help our AI learn your preferences and provide better recommendations.
            </p>
            <Button onClick={refreshRecommendations} disabled={refreshing}>
              <Sparkles className="h-4 w-4 mr-2" />
              Start Learning
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ML Learning Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">AI Learning Status</p>
                <p className="text-sm text-purple-700">
                  {insights?.totalInteractions > 10
                    ? "Your AI model is well-trained and providing accurate recommendations"
                    : "Keep reading to improve your personalization accuracy"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">
                {Math.min(100, Math.round((insights?.totalInteractions || 0) * 5))}%
              </div>
              <div className="text-xs text-purple-700">Accuracy</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NewsCard } from "@/components/news-card"
import { useRecommendations } from "@/hooks/use-recommendations"
import { Loader2, Sparkles, TrendingUp, User, RefreshCw } from "lucide-react"
import type { NewsArticle } from "@/types/news"

interface PersonalizedFeedProps {
  userId: string | null
  articles?: NewsArticle[]
}

export function PersonalizedFeed({ userId, articles = [] }: PersonalizedFeedProps) {
  const { personalizedFeed, loading, error, fetchPersonalizedFeed, trackInteraction } = useRecommendations(userId)

  const [feedArticles, setFeedArticles] = useState<NewsArticle[]>(articles)

  useEffect(() => {
    if (personalizedFeed?.articles) {
      // Convert recommendation results to NewsArticle format
      const convertedArticles: NewsArticle[] = personalizedFeed.articles.map((item: any) => ({
        id: item.id || item.articleId,
        title: item.personalizedHeadline || item.title,
        description: item.description || `Recommended: ${item.reason}`,
        content: item.content || item.description || "",
        url: item.url || "#",
        urlToImage: item.urlToImage || null,
        publishedAt: item.publishedAt || new Date().toISOString(),
        source: { id: null, name: item.source || "Recommended" },
        author: item.author || "AI Curator",
        credibilityScore: Math.round((item.score || 0.5) * 100),
        isFactChecked: false,
      }))
      setFeedArticles(convertedArticles)
    }
  }, [personalizedFeed])

  const handleArticleInteraction = (action: string, articleId: string, timeSpent?: number) => {
    trackInteraction(action, articleId, timeSpent)
  }

  const handleRefresh = () => {
    fetchPersonalizedFeed()
  }

  if (!userId) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6 text-center">
          <User className="h-12 w-12 mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-semibold mb-2">Sign in for Personalized News</h3>
          <p className="text-gray-600 mb-4">
            Get AI-powered recommendations tailored to your interests and reading history.
          </p>
          <Button>Sign In</Button>
        </CardContent>
      </Card>
    )
  }

  if (loading && !personalizedFeed) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Curating personalized news for you...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">Failed to load personalized feed</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Personalized Header */}
      {personalizedFeed && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-purple-800">Your Personalized Feed</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  {personalizedFeed.feedType === "personalized" ? "AI Curated" : "Trending"}
                </Badge>
                <Button onClick={handleRefresh} variant="ghost" size="sm" disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-purple-700">{personalizedFeed.personalizedMessage}</p>
            <div className="flex items-center gap-4 mt-3 text-sm text-purple-600">
              <span>• {personalizedFeed.recommendations.length} articles curated</span>
              <span>• Updated {new Date(personalizedFeed.lastUpdated).toLocaleTimeString()}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendation Insights */}
      {personalizedFeed?.recommendations && personalizedFeed.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Why These Articles?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {personalizedFeed.recommendations.slice(0, 6).map((rec, index) => (
                <div key={rec.articleId} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {rec.category}
                    </Badge>
                    <span className="text-xs text-gray-500">{Math.round(rec.score * 100)}% match</span>
                  </div>
                  <p className="text-sm text-gray-700">{rec.reason}</p>
                  {rec.confidence && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${rec.confidence * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* News Articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {feedArticles.map((article) => (
          <div key={article.id} className="relative">
            <NewsCard article={article} onInteraction={handleArticleInteraction} />
            {personalizedFeed?.recommendations.find((r) => r.articleId === article.id) && (
              <Badge className="absolute -top-2 -right-2 bg-purple-600 text-white" variant="default">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Pick
              </Badge>
            )}
          </div>
        ))}
      </div>

      {feedArticles.length === 0 && !loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-4">No personalized articles available yet.</p>
            <p className="text-sm text-gray-400">Start reading articles to help us learn your preferences!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

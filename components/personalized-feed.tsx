"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NewsCard } from "@/components/news-card"
import { useRecommendations } from "@/hooks/use-recommendations"
import { Loader2, Sparkles, TrendingUp, User, RefreshCw, Heart, Eye, Clock } from "lucide-react"
import type { NewsArticle } from "@/types/news"

interface PersonalizedFeedProps {
  userId: string | null
  articles?: NewsArticle[]
}

export function PersonalizedFeed({ userId, articles = [] }: PersonalizedFeedProps) {
  const { personalizedFeed, loading, error, fetchPersonalizedFeed, trackInteraction } = useRecommendations(userId)
  const [feedArticles, setFeedArticles] = useState<NewsArticle[]>([])
  const [readingTime, setReadingTime] = useState<Record<string, number>>({})

  useEffect(() => {
    if (personalizedFeed?.articles && personalizedFeed.articles.length > 0) {
      setFeedArticles(personalizedFeed.articles)
    } else if (articles.length > 0) {
      // Use real API articles for personalization
      setFeedArticles(articles.slice(0, 10))
    }
  }, [personalizedFeed, articles])

  const handleArticleInteraction = (action: string, articleId: string, timeSpent?: number) => {
    trackInteraction(action, articleId, timeSpent)

    // Track reading time locally
    if (action === "read" && timeSpent) {
      setReadingTime((prev) => ({
        ...prev,
        [articleId]: (prev[articleId] || 0) + timeSpent,
      }))
    }
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
            Get AI-powered recommendations from real NewsAPI data tailored to your interests.
          </p>
          <div className="space-y-2 text-sm text-gray-500 mb-4">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Smart content curation from NewsAPI</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Personalized headlines</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Heart className="h-4 w-4" />
              <span>Interest-based recommendations</span>
            </div>
          </div>
          <Button>Sign In to Get Started</Button>
        </CardContent>
      </Card>
    )
  }

  if (loading && feedArticles.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="mb-2">Curating personalized news from NewsAPI...</p>
          <p className="text-sm text-gray-500">Analyzing your preferences with real news data</p>
        </CardContent>
      </Card>
    )
  }

  if (error && feedArticles.length === 0) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <p className="text-red-600 mb-4">Failed to load personalized feed from NewsAPI</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (feedArticles.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No News Available</h3>
          <p className="text-gray-500 mb-4">Unable to fetch articles from NewsAPI.org</p>
          <p className="text-sm text-gray-400 mb-6">Please check your NewsAPI connection and try refreshing.</p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Feed
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Personalized Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-purple-800">Your Personalized Feed</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                NewsAPI Data
              </Badge>
              <Button onClick={handleRefresh} variant="ghost" size="sm" disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-purple-700 mb-3">
            {personalizedFeed?.personalizedMessage ||
              `Here are ${feedArticles.length} articles from NewsAPI.org, personalized for you based on your reading patterns.`}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-purple-600">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{feedArticles.length} articles from NewsAPI</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Updated {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>Real-time data</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reading Statistics */}
      {Object.keys(readingTime).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Your Reading Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Object.values(readingTime).reduce((acc, time) => acc + time, 0)}s
                </div>
                <div className="text-sm text-blue-600">Total Reading Time</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{Object.keys(readingTime).length}</div>
                <div className="text-sm text-green-600">Articles Read</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(
                    Object.values(readingTime).reduce((acc, time) => acc + time, 0) / Object.keys(readingTime).length,
                  ) || 0}
                  s
                </div>
                <div className="text-sm text-purple-600">Avg. Reading Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* News Articles Grid */}
      <div className="masonry-grid">
        {feedArticles.map((article, index) => (
          <div key={article.id} className="masonry-item relative">
            <NewsCard article={article} onInteraction={handleArticleInteraction} />
            <div className="absolute -top-2 -right-2 z-10">
              <Badge className="bg-blue-600 text-white shadow-lg" variant="default">
                <Sparkles className="h-3 w-3 mr-1" />
                NewsAPI #{index + 1}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .masonry-grid {
          column-count: 1;
          column-gap: 1.5rem;
          margin: 0;
        }

        @media (min-width: 640px) {
          .masonry-grid {
            column-count: 2;
          }
        }

        @media (min-width: 1024px) {
          .masonry-grid {
            column-count: 3;
          }
        }

        @media (min-width: 1280px) {
          .masonry-grid {
            column-count: 4;
          }
        }

        .masonry-item {
          break-inside: avoid;
          margin-bottom: 1.5rem;
          display: inline-block;
          width: 100%;
        }
      `}</style>
    </div>
  )
}

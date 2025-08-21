"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { fetchNews } from "@/lib/news-api"
import { formatDistanceToNow } from "@/lib/utils"
import type { NewsArticle } from "@/types/news"
import {
  Clock,
  Bookmark,
  MessageSquare,
  Share2,
  Shield,
  Sparkles,
  RefreshCw,
  Loader2,
  Info,
  User,
  Brain,
  TrendingUp,
} from "lucide-react"

interface PersonalizedFeedProps {
  userId?: string | null
  articles?: NewsArticle[]
}

export function PersonalizedFeed({ userId, articles: providedArticles }: PersonalizedFeedProps) {
  const [personalizedArticles, setPersonalizedArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingDemo, setIsUsingDemo] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Mock user preferences for personalization
  const userPreferences = {
    categories: ["technology", "business", "science"],
    keywords: ["AI", "innovation", "startup", "research"],
    readingHistory: ["tech", "business", "science"],
  }

  useEffect(() => {
    const loadPersonalizedFeed = async () => {
      try {
        setLoading(true)
        setError(null)
        setIsUsingDemo(false)

        // If articles are provided, use them for personalization
        if (providedArticles && providedArticles.length > 0) {
          const personalized = personalizeArticles(providedArticles)
          setPersonalizedArticles(personalized)

          // Check if using demo data
          const hasDemoData = personalized.some((article) => article.id.includes("demo"))
          if (hasDemoData) {
            setIsUsingDemo(true)
            setError("Personalized feed is using demo content due to NewsAPI limitations.")
          }
        } else {
          // Fetch fresh articles for personalization
          console.log("Loading personalized feed...")

          const [techNews, businessNews, scienceNews] = await Promise.all([
            fetchNews({ category: "technology", pageSize: 8, country: "us" }),
            fetchNews({ category: "business", pageSize: 8, country: "us" }),
            fetchNews({ category: "science", pageSize: 6, country: "us" }),
          ])

          const allArticles = [...techNews, ...businessNews, ...scienceNews]
          const hasDemoData = allArticles.some((article) => article.id.includes("demo"))

          if (hasDemoData) {
            setIsUsingDemo(true)
            setError("Personalized feed is using demo content due to NewsAPI limitations.")
          }

          const personalized = personalizeArticles(allArticles)
          setPersonalizedArticles(personalized)
        }

        console.log(`Loaded ${personalizedArticles.length} personalized articles`)
      } catch (error) {
        console.error("Failed to load personalized feed:", error)
        setError("Unable to load personalized feed. Please try again later.")
        setIsUsingDemo(true)
      } finally {
        setLoading(false)
      }
    }

    loadPersonalizedFeed()
  }, [providedArticles, userId])

  // Personalization algorithm
  const personalizeArticles = (articles: NewsArticle[]): NewsArticle[] => {
    if (!articles || articles.length === 0) return []

    // Score articles based on user preferences
    const scoredArticles = articles.map((article) => {
      let score = 0

      // Category preference scoring
      const articleCategory = getCategoryFromSource(article.source.name)
      if (userPreferences.categories.includes(articleCategory)) {
        score += 3
      }

      // Keyword matching in title and description
      const text = `${article.title} ${article.description}`.toLowerCase()
      userPreferences.keywords.forEach((keyword) => {
        if (text.includes(keyword.toLowerCase())) {
          score += 2
        }
      })

      // Recency boost
      const hoursAgo = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60)
      if (hoursAgo < 6) score += 2
      else if (hoursAgo < 24) score += 1

      // Credibility boost
      if (article.credibilityScore && article.credibilityScore > 80) {
        score += 1
      }

      return { ...article, personalizedScore: score }
    })

    // Sort by personalized score and return top articles
    return scoredArticles.sort((a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0)).slice(0, 12)
  }

  // Helper function to determine category from source
  const getCategoryFromSource = (sourceName: string): string => {
    const techSources = ["tech", "wired", "verge", "techcrunch", "ars technica"]
    const businessSources = ["business", "financial", "bloomberg", "reuters", "wall street"]
    const scienceSources = ["science", "nature", "scientific", "research"]

    const lowerSource = sourceName.toLowerCase()

    if (techSources.some((tech) => lowerSource.includes(tech))) return "technology"
    if (businessSources.some((biz) => lowerSource.includes(biz))) return "business"
    if (scienceSources.some((sci) => lowerSource.includes(sci))) return "science"

    return "general"
  }

  // Refresh personalized feed
  const refreshFeed = async () => {
    setRefreshing(true)
    try {
      const [techNews, businessNews, scienceNews] = await Promise.all([
        fetchNews({ category: "technology", pageSize: 8, country: "us", forceRefresh: true }),
        fetchNews({ category: "business", pageSize: 8, country: "us", forceRefresh: true }),
        fetchNews({ category: "science", pageSize: 6, country: "us", forceRefresh: true }),
      ])

      const allArticles = [...techNews, ...businessNews, ...scienceNews]
      const hasDemoData = allArticles.some((article) => article.id.includes("demo"))

      if (hasDemoData) {
        setIsUsingDemo(true)
        setError("Refreshed personalized feed is using demo content.")
      } else {
        setIsUsingDemo(false)
        setError(null)
      }

      const personalized = personalizeArticles(allArticles)
      setPersonalizedArticles(personalized)

      console.log("Personalized feed refreshed successfully")
    } catch (error) {
      console.error("Failed to refresh personalized feed:", error)
      setError("Failed to refresh personalized feed.")
    } finally {
      setRefreshing(false)
    }
  }

  // Function to render credibility badge
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
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Personalizing your news feed...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Alert */}
      {error && (
        <Alert className="bg-yellow-900/20 border-yellow-600">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-yellow-200">
            {error}
            {isUsingDemo && (
              <div className="mt-2 text-sm">
                <strong>Note:</strong> Demo content is personalized based on sample preferences.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  {isUsingDemo ? "Demo Personalized Feed" : "Your Personalized Feed"}
                </h2>
                <p className="text-sm text-purple-700">
                  {isUsingDemo
                    ? "Sample articles tailored to demo preferences"
                    : "AI-curated articles based on your reading preferences"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={refreshFeed} disabled={refreshing} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Preferences Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isUsingDemo ? "Demo Preferences" : "Your Preferences"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium mb-2">Favorite Categories</h4>
              <div className="flex flex-wrap gap-1">
                {userPreferences.categories.map((category) => (
                  <Badge key={category} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Interest Keywords</h4>
              <div className="flex flex-wrap gap-1">
                {userPreferences.keywords.map((keyword) => (
                  <Badge key={keyword} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Reading History</h4>
              <div className="flex flex-wrap gap-1">
                {userPreferences.readingHistory.map((topic) => (
                  <Badge key={topic} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personalized Articles */}
      {personalizedArticles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personalizedArticles.map((article, index) => (
            <Card
              key={article.id}
              className="bg-card border-border overflow-hidden group hover:border-primary/50 transition-all"
            >
              <Link href={article.url} target="_blank" rel="noopener noreferrer">
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={article.urlToImage || "/placeholder.svg?height=200&width=300"}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-purple-600 text-white text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />#{index + 1} For You
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
                  <h3 className="font-bold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-muted-foreground text-xs mb-3 line-clamp-2">{article.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(article.publishedAt))} ago
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className="text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                      >
                        <MessageSquare className="h-3 w-3" />
                      </button>
                      <button
                        className="text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                      >
                        <Bookmark className="h-3 w-3" />
                      </button>
                      <button
                        className="text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
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
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Personalized Articles Available</h3>
            <p className="text-muted-foreground mb-4">
              {isUsingDemo
                ? "Demo personalization is not available at the moment."
                : "Unable to load personalized articles. Please check your connection and try again."}
            </p>
            <Button onClick={refreshFeed} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Personalization Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Personalization Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{personalizedArticles.length}</div>
              <div className="text-muted-foreground">Articles Curated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(
                  personalizedArticles.reduce((acc, article) => acc + (article.credibilityScore || 0), 0) /
                    personalizedArticles.length || 0,
                )}
                %
              </div>
              <div className="text-muted-foreground">Avg Credibility</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {userPreferences.categories.length + userPreferences.keywords.length}
              </div>
              <div className="text-muted-foreground">Preference Signals</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

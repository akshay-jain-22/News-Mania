"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { fetchNews } from "@/lib/news-api"
import { formatDistanceToNow } from "@/lib/utils"
import type { NewsArticle } from "@/types/news"
import {
  Clock,
  Bookmark,
  MessageSquare,
  Share2,
  Shield,
  AlertCircle,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Server,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const categoryNames: Record<string, string> = {
  business: "Business",
  technology: "Technology",
  health: "Health",
  sports: "Sports",
  science: "Science",
  entertainment: "Entertainment",
  general: "General News",
}

export default function TopicPage() {
  const params = useParams()
  const topic = params.topic as string

  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const categoryName = categoryNames[topic] || topic.charAt(0).toUpperCase() + topic.slice(1)

  // Load news for specific topic
  const loadTopicNews = async (isRetry = false) => {
    try {
      if (isRetry) {
        setRetrying(true)
      } else {
        setLoading(true)
      }
      setError(null)
      console.log(`Loading ${topic} news from NewsAPI...`)

      const articles = await fetchNews({
        category: topic === "general" ? undefined : topic,
        pageSize: 20,
        country: "us",
        forceRefresh: isRetry,
      })

      if (articles.length === 0) {
        throw new Error(`No ${categoryName} articles available at the moment`)
      }

      setNewsArticles(articles)
      setPage(2)

      console.log(`Successfully loaded ${articles.length} ${topic} articles`)
    } catch (error) {
      console.error(`Failed to load ${topic} news:`, error)
      setError(error instanceof Error ? error.message : `Unable to fetch ${categoryName} news. Please try again later.`)
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }

  useEffect(() => {
    if (topic) {
      loadTopicNews()
    }
  }, [topic])

  // Retry function
  const handleRetry = () => {
    loadTopicNews(true)
  }

  // Load more news
  const loadMoreNews = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      console.log(`Loading more ${topic} news, page ${page}`)

      const moreArticles = await fetchNews({
        category: topic === "general" ? undefined : topic,
        pageSize: 10,
        page,
        country: "us",
      })

      if (moreArticles.length > 0) {
        setNewsArticles((prev) => [...prev, ...moreArticles])
        setPage((prev) => prev + 1)
        console.log(`Loaded ${moreArticles.length} more ${topic} articles`)
      } else {
        setHasMore(false)
        console.log("No more articles to load")
      }
    } catch (error) {
      console.error("Failed to load more news:", error)
      setHasMore(false)
    } finally {
      setLoadingMore(false)
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Main Navigation */}
      <header className="bg-[#121212] border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold">NewsMania</span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="hover:text-primary transition-colors">
                Latest
              </Link>
              <Link href="/topics" className="text-primary font-medium">
                Topics
              </Link>
              <Link href="/fact-check" className="hover:text-primary transition-colors">
                Fact Check
              </Link>
              <Link href="/extract" className="hover:text-primary transition-colors">
                Extract News
              </Link>
              <Link href="/notes" className="hover:text-primary transition-colors">
                My Notes
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <span className="text-gray-500">/</span>
          <span className="text-gray-400">Topics</span>
          <span className="text-gray-500">/</span>
          <span className="text-primary">{categoryName}</span>
        </div>

        {/* Error Alert with Retry */}
        {error && (
          <Alert className="mb-6 bg-red-900/20 border-red-600">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-red-200">{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={retrying}
                className="ml-4 border-red-600 text-red-200 hover:bg-red-900/20"
              >
                {retrying ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Retry
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <span className="text-xl mb-2">Loading {categoryName} news...</span>
            <span className="text-sm text-gray-400">Fetching latest articles from NewsAPI</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Unable to Load {categoryName} News</h2>
            <p className="text-gray-400 text-center max-w-md mb-6">
              We're having trouble loading {categoryName.toLowerCase()} articles. Please try again.
            </p>
            <Button onClick={handleRetry} disabled={retrying}>
              {retrying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </>
              )}
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{categoryName}</h1>
                  <p className="text-gray-400">Latest {categoryName.toLowerCase()} news and updates</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Server className="h-4 w-4" />
                  <span>{newsArticles.length} articles</span>
                </div>
              </div>
            </div>

            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {newsArticles.map((article) => (
                <Card
                  key={article.id}
                  className="bg-[#1a1a1a] border-gray-800 overflow-hidden group hover:border-gray-700 transition-all"
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
                        <Badge className="bg-[#121212]/80 backdrop-blur-sm text-white text-xs">
                          {article.source.name}
                        </Badge>
                      </div>
                      {article.credibilityScore && (
                        <div className="absolute top-2 right-2">{renderCredibilityBadge(article.credibilityScore)}</div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-gray-400 text-xs mb-3 line-clamp-2">{article.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(new Date(article.publishedAt))} ago
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-gray-500 hover:text-primary"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                          >
                            <MessageSquare className="h-3 w-3" />
                          </button>
                          <button
                            className="text-gray-500 hover:text-primary"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                            }}
                          >
                            <Bookmark className="h-3 w-3" />
                          </button>
                          <button
                            className="text-gray-500 hover:text-primary"
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

            {/* Load More Button */}
            {hasMore && newsArticles.length > 0 && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="border-gray-700 hover:bg-gray-800"
                  onClick={loadMoreNews}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading More...
                    </>
                  ) : (
                    "Load More News"
                  )}
                </Button>
              </div>
            )}

            {!hasMore && newsArticles.length > 0 && (
              <div className="text-center text-gray-500">
                <p>You've reached the end of {categoryName.toLowerCase()} news</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

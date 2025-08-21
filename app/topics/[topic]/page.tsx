"use client"

import { useState, useEffect } from "react"
import { NewsHeader } from "@/components/news-header"
import { NewsCard } from "@/components/news-card"
import { fetchNews } from "@/lib/news-api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChevronLeft, Loader2, RefreshCw, Filter, TrendingUp } from "lucide-react"
import Link from "next/link"
import type { NewsArticle } from "@/types/news"

interface TopicPageProps {
  params: {
    topic: string
  }
}

const topicInfo: Record<string, { name: string; description: string; color: string }> = {
  business: {
    name: "Business",
    description: "Latest business news, market updates, and financial insights",
    color: "bg-blue-500",
  },
  technology: {
    name: "Technology",
    description: "Tech innovations, gadgets, software, and digital trends",
    color: "bg-purple-500",
  },
  health: {
    name: "Health",
    description: "Medical breakthroughs, wellness tips, and healthcare news",
    color: "bg-red-500",
  },
  sports: {
    name: "Sports",
    description: "Sports news, scores, games, and athletic achievements",
    color: "bg-yellow-500",
  },
  science: {
    name: "Science",
    description: "Scientific discoveries, research, and technological advances",
    color: "bg-green-500",
  },
  entertainment: {
    name: "Entertainment",
    description: "Movies, music, celebrities, and entertainment industry news",
    color: "bg-pink-500",
  },
}

export default function TopicPage({ params }: TopicPageProps) {
  const { topic } = params
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const topicData = topicInfo[topic] || {
    name: topic.charAt(0).toUpperCase() + topic.slice(1),
    description: `Latest news about ${topic}`,
    color: "bg-gray-500",
  }

  useEffect(() => {
    loadTopicNews()
  }, [topic])

  const loadTopicNews = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log(`Loading ${topic} news...`)

      const newsArticles = await fetchNews({
        category: topic,
        pageSize: 20,
        country: "us",
      })

      setArticles(newsArticles)
      setPage(2)
      setHasMore(newsArticles.length >= 20)

      console.log(`Loaded ${newsArticles.length} ${topic} articles`)
    } catch (error) {
      console.error(`Failed to load ${topic} news:`, error)
      setError(`Unable to load ${topic} news. Please check your connection and try again.`)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreNews = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      console.log(`Loading more ${topic} news, page ${page}`)

      const moreArticles = await fetchNews({
        category: topic,
        pageSize: 10,
        page,
        country: "us",
      })

      if (moreArticles.length > 0) {
        setArticles((prev) => [...prev, ...moreArticles])
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

  const refreshNews = async () => {
    setPage(1)
    setHasMore(true)
    await loadTopicNews()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <NewsHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-xl">Loading {topicData.name} news...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <NewsHeader />

      <main className="container mx-auto px-4 py-8">
        {error && (
          <Alert className="mb-6 bg-red-900/20 border-red-600">
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild className="text-gray-400 hover:text-white">
              <Link href="/topics">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Topics
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-lg ${topicData.color}`}>
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">{topicData.name} News</h1>
              <p className="text-gray-400 text-lg">{topicData.description}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={`${topicData.color} text-white`}>{articles.length} Articles</Badge>
              <Badge variant="outline" className="text-gray-400 border-gray-600">
                Updated continuously
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshNews}
                disabled={loading}
                className="bg-transparent border-gray-700 hover:bg-gray-800"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="bg-transparent border-gray-700 hover:bg-gray-800">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </div>

        {/* Articles Grid - Exactly 3 columns for full screen */}
        {articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {articles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="border-gray-700 hover:bg-gray-800 bg-transparent"
                  onClick={loadMoreNews}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading More...
                    </>
                  ) : (
                    `Load More ${topicData.name} News`
                  )}
                </Button>
              </div>
            )}

            {!hasMore && (
              <div className="text-center text-gray-500">
                <p>You've reached the end of {topicData.name.toLowerCase()} news</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No {topicData.name} News Available</h3>
            <p className="text-gray-400 mb-6">Unable to load {topicData.name.toLowerCase()} articles at the moment.</p>
            <Button onClick={refreshNews} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Try Again
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

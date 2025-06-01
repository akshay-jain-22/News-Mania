"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { fetchNews, fetchMoreNews } from "@/lib/news-api"
import { formatDistanceToNow } from "@/lib/utils"
import type { NewsArticle } from "@/types/news"
import { Clock, Bookmark, MessageSquare, Share2, Shield, AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Home() {
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const categories = [
    { id: "business", name: "BUSINESS" },
    { id: "technology", name: "TECH" },
    { id: "health", name: "HEALTH" },
    { id: "sports", name: "SPORTS" },
    { id: "science", name: "SCIENCE" },
    { id: "entertainment", name: "ENTERTAINMENT" },
  ]

  // Load initial news
  useEffect(() => {
    const loadInitialNews = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log("Loading initial news...")

        const articles = await fetchNews({ pageSize: 30, page: 1 })

        if (articles && articles.length > 0) {
          setNewsArticles(articles)
          setPage(2) // Next page to load
          console.log(`Loaded ${articles.length} articles`)
        } else {
          setError("No news articles available at the moment")
          setHasMore(false)
        }
      } catch (error) {
        console.error("Failed to load news:", error)
        setError("Failed to load news. Please check your internet connection and try again.")
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    }

    loadInitialNews()
  }, [])

  // Load more news for infinite scroll
  const loadMoreNews = useCallback(async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      console.log(`Loading more news, page ${page}`)

      const moreArticles = await fetchMoreNews(page)

      if (moreArticles && moreArticles.length > 0) {
        setNewsArticles((prev) => [...prev, ...moreArticles])
        setPage((prev) => prev + 1)
        console.log(`Loaded ${moreArticles.length} more articles`)
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
  }, [page, loadingMore, hasMore])

  // Function to get random card height for masonry effect
  const getCardHeight = (index: number, article: NewsArticle): string => {
    const seed = article.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const heights = ["h-64", "h-72", "h-80", "h-96", "h-[28rem]", "h-[32rem]"]
    return heights[seed % heights.length]
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
      {/* Top Navigation Bar */}
      <div className="bg-[#1a1a1a] py-2 px-4 hidden md:block">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6 text-xs">
            {categories.map((category) => (
              <Link key={category.id} href={`/topics/${category.id}`} className="hover:text-primary transition-colors">
                {category.name}
              </Link>
            ))}
          </div>
          <div>
            <Button variant="ghost" size="sm" className="text-xs">
              <Link href="/dashboard">DASHBOARD</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="bg-[#121212] border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold">NewsMania</span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-primary font-medium">
                Latest
              </Link>
              <Link href="/topics" className="hover:text-primary transition-colors">
                Topics
              </Link>
              <Link href="/fact-check" className="hover:text-primary transition-colors">
                Fact Check
              </Link>
              <Link href="/my-notes" className="hover:text-primary transition-colors">
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

      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Live News Feed</h1>
          <p className="text-gray-400">Real-time news from around the world</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 bg-red-900/20 border-red-600">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          // Loading skeleton with masonry layout
          <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="break-inside-avoid mb-6">
                <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
                  <div
                    className={`bg-gray-800 animate-pulse ${getCardHeight(i, { id: `skeleton-${i}` } as NewsArticle)}`}
                  ></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-800 rounded animate-pulse w-1/4"></div>
                    <div className="h-6 bg-gray-800 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4"></div>
                    <div className="h-4 bg-gray-800 rounded animate-pulse w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : newsArticles.length > 0 ? (
          <>
            {/* Masonry Grid Layout */}
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6">
              {newsArticles.map((article, index) => (
                <div key={article.id} className="break-inside-avoid mb-6">
                  <Card className="bg-[#1a1a1a] border-gray-800 overflow-hidden group hover:border-gray-700 transition-all">
                    <Link href={article.url} target="_blank" rel="noopener noreferrer">
                      {article.urlToImage && (
                        <div className={`relative overflow-hidden ${getCardHeight(index, article)}`}>
                          <Image
                            src={article.urlToImage || "/placeholder.svg"}
                            alt={article.title}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = "none"
                            }}
                          />
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-[#121212]/80 backdrop-blur-sm text-white text-xs">
                              {article.source.name}
                            </Badge>
                          </div>
                          {article.credibilityScore && (
                            <div className="absolute top-2 right-2">
                              {renderCredibilityBadge(article.credibilityScore)}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="p-4">
                        <h2 className="text-lg font-bold mb-2 line-clamp-3 group-hover:text-primary transition-colors">
                          {article.title}
                        </h2>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-3">{article.description}</p>
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
                                // Handle comment action
                              }}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </button>
                            <button
                              className="text-gray-500 hover:text-primary"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                // Handle bookmark action
                              }}
                            >
                              <Bookmark className="h-4 w-4" />
                            </button>
                            <button
                              className="text-gray-500 hover:text-primary"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                // Handle share action
                              }}
                            >
                              <Share2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Card>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-10">
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
              <div className="text-center mt-10 text-gray-500">
                <p>You've reached the end of the news feed</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No news articles available</p>
          </div>
        )}
      </main>

      <footer className="bg-[#121212] border-t border-gray-800 py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">NewsMania</h3>
              <p className="text-sm text-gray-400 mb-4">
                Your trusted source for breaking news, in-depth reporting, and fact-checked journalism.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/topics" className="text-gray-400 hover:text-primary">
                    Topics
                  </Link>
                </li>
                <li>
                  <Link href="/fact-check" className="text-gray-400 hover:text-primary">
                    Fact Check
                  </Link>
                </li>
                <li>
                  <Link href="/my-notes" className="text-gray-400 hover:text-primary">
                    My Notes
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-gray-400 hover:text-primary">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Subscribe</h3>
              <p className="text-sm text-gray-400 mb-4">Get the latest news delivered to your inbox</p>
              <form className="space-y-2">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="w-full px-3 py-2 bg-[#2e2e2e] border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button className="w-full">Subscribe</Button>
              </form>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

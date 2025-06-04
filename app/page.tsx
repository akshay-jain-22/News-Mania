"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
  TrendingUp,
  Globe,
  Zap,
  Heart,
  Trophy,
  Briefcase,
  Monitor,
  RefreshCw,
  Server,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function Home() {
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [trendingNews, setTrendingNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retrying, setRetrying] = useState(false)
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

  // Load real news from API only
  const loadAllNews = async (isRetry = false) => {
    try {
      if (isRetry) {
        setRetrying(true)
      } else {
        setLoading(true)
      }
      setError(null)
      console.log("Loading real news from NewsAPI via server...")

      // Try different approaches to get news
      let newsArticles: NewsArticle[] = []
      let trendingArticles: NewsArticle[] = []

      try {
        // First try: Get general news
        console.log("Attempting to fetch general news...")
        const generalNews = await fetchNews({
          category: "general",
          pageSize: 20,
          country: "us",
          forceRefresh: isRetry,
        })
        newsArticles = [...newsArticles, ...generalNews]
        console.log(`Fetched ${generalNews.length} general articles`)
      } catch (generalError) {
        console.log("General news failed, trying without country filter...")
        try {
          // Second try: Get news without country filter
          const globalNews = await fetchNews({
            pageSize: 20,
            forceRefresh: isRetry,
          })
          newsArticles = [...newsArticles, ...globalNews]
          console.log(`Fetched ${globalNews.length} global articles`)
        } catch (globalError) {
          console.log("Global news failed, trying with sources...")
          try {
            // Third try: Use specific sources
            const sourceNews = await fetchNews({
              sources: ["bbc-news", "reuters", "cnn", "the-guardian-uk"],
              pageSize: 20,
              forceRefresh: isRetry,
            })
            newsArticles = [...newsArticles, ...sourceNews]
            console.log(`Fetched ${sourceNews.length} source articles`)
          } catch (sourceError) {
            throw new Error("Unable to fetch news from any source")
          }
        }
      }

      // Try to get trending news (use first 5 articles as trending)
      trendingArticles = newsArticles.slice(0, 5)

      if (newsArticles.length === 0) {
        throw new Error("No news articles available from the API")
      }

      setNewsArticles(newsArticles)
      setTrendingNews(trendingArticles)
      setPage(2)

      console.log(`Successfully loaded ${newsArticles.length} real news articles`)
    } catch (error) {
      console.error("Failed to load real news:", error)
      setError(
        error instanceof Error
          ? error.message
          : "Unable to fetch news from the API. Please check your internet connection or try again later.",
      )
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }

  useEffect(() => {
    loadAllNews()
  }, [])

  // Retry function
  const handleRetry = () => {
    loadAllNews(true)
  }

  // Load more real news
  const loadMoreNews = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      console.log(`Loading more real news, page ${page}`)

      const moreArticles = await fetchNews({
        category: "general",
        pageSize: 10,
        page,
        country: "us",
      })

      if (moreArticles.length > 0) {
        setNewsArticles((prev) => [...prev, ...moreArticles])
        setPage((prev) => prev + 1)
        console.log(`Loaded ${moreArticles.length} more real articles`)
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
          <div className="flex items-center space-x-4">
            {!error && newsArticles.length > 0 && (
              <div className="flex items-center text-xs text-green-400">
                <Server className="h-3 w-3 mr-1" />
                Server-Side API
              </div>
            )}
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
            <span className="text-xl mb-2">Loading latest news from NewsAPI...</span>
            <span className="text-sm text-gray-400">Fetching real-time articles via server</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Unable to Load News</h2>
            <p className="text-gray-400 text-center max-w-md mb-6">
              We're having trouble connecting to our news sources. Please check your internet connection and try again.
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {/* Hero Section */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Live News Feed</h1>
                <p className="text-gray-400">Real-time news from around the world via NewsAPI</p>
              </div>

              {/* Featured Article */}
              {newsArticles.length > 0 && (
                <div className="mb-8">
                  <Card className="bg-[#1a1a1a] border-gray-800 overflow-hidden">
                    <Link href={newsArticles[0].url} target="_blank" rel="noopener noreferrer">
                      <div className="relative aspect-[16/9]">
                        <Image
                          src={newsArticles[0].urlToImage || "/placeholder.svg?height=400&width=800"}
                          alt={newsArticles[0].title}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <Badge className="mb-3 bg-red-600 hover:bg-red-700">BREAKING</Badge>
                          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-2">
                            {newsArticles[0].title}
                          </h2>
                          <p className="text-gray-200 text-sm line-clamp-2">{newsArticles[0].description}</p>
                          <div className="flex items-center mt-3 text-xs text-gray-300">
                            <span>{newsArticles[0].source.name}</span>
                            <span className="mx-2">•</span>
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDistanceToNow(new Date(newsArticles[0].publishedAt))} ago
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Card>
                </div>
              )}

              {/* Real News Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {newsArticles.slice(1).map((article) => (
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
                          <div className="absolute top-2 right-2">
                            {renderCredibilityBadge(article.credibilityScore)}
                          </div>
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
                  <p>You've reached the end of the news feed</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Connection Status */}
              <Card className="bg-[#1a1a1a] border-gray-800 mb-6">
                <CardHeader>
                  <div className="flex items-center">
                    <Server className="h-5 w-5 mr-2 text-green-500" />
                    <h3 className="font-bold">Server-Side NewsAPI</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-400">
                    {newsArticles.length > 0
                      ? `Showing ${newsArticles.length} real-time articles`
                      : "Connecting to news sources..."}
                  </p>
                </CardContent>
              </Card>

              {/* Trending News */}
              {trendingNews.length > 0 && (
                <Card className="bg-[#1a1a1a] border-gray-800 mb-6">
                  <CardHeader>
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-primary" />
                      <h3 className="font-bold">Trending Now</h3>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {trendingNews.map((article, index) => (
                      <div key={article.id} className="flex items-start space-x-3 group">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={article.url} target="_blank" rel="noopener noreferrer">
                            <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                              {article.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDistanceToNow(new Date(article.publishedAt))} ago
                            </p>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card className="bg-[#1a1a1a] border-gray-800 mb-6">
                <CardHeader>
                  <h3 className="font-bold">Quick Actions</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-start" variant="ghost">
                    <Link href="/fact-check">
                      <Shield className="h-4 w-4 mr-2" />
                      Fact Check News
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="ghost">
                    <Link href="/extract">
                      <Zap className="h-4 w-4 mr-2" />
                      Extract Article
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="ghost">
                    <Link href="/notes">
                      <Bookmark className="h-4 w-4 mr-2" />
                      My Saved Notes
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="ghost">
                    <Link href="/search">
                      <Globe className="h-4 w-4 mr-2" />
                      Search News
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Categories Quick Access */}
              <Card className="bg-[#1a1a1a] border-gray-800 mb-6">
                <CardHeader>
                  <h3 className="font-bold">Browse Categories</h3>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { id: "business", name: "Business", icon: Briefcase },
                    { id: "technology", name: "Technology", icon: Monitor },
                    { id: "health", name: "Health", icon: Heart },
                    { id: "sports", name: "Sports", icon: Trophy },
                  ].map((category) => {
                    const Icon = category.icon
                    return (
                      <Button key={category.id} asChild className="w-full justify-start" variant="ghost" size="sm">
                        <Link href={`/topics/${category.id}`}>
                          <Icon className="h-3 w-3 mr-2" />
                          {category.name}
                        </Link>
                      </Button>
                    )
                  })}
                </CardContent>
              </Card>

              {/* Newsletter Signup */}
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader>
                  <h3 className="font-bold">Stay Updated</h3>
                  <p className="text-sm text-gray-400">Get the latest news delivered to your inbox</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="w-full px-3 py-2 bg-[#2e2e2e] border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  />
                  <Button className="w-full">Subscribe</Button>
                </CardContent>
              </Card>
            </div>
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
                  <Link href="/extract" className="text-gray-400 hover:text-primary">
                    Extract News
                  </Link>
                </li>
                <li>
                  <Link href="/notes" className="text-gray-400 hover:text-primary">
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
              <h3 className="text-lg font-bold mb-4">Categories</h3>
              <ul className="space-y-2 text-sm">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link href={`/topics/${category.id}`} className="text-gray-400 hover:text-primary">
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

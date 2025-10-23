"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  TrendingUp,
  User,
  Settings,
  Bell,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Loader2,
  BarChart3,
  Eye,
  Heart,
  BookOpen,
} from "lucide-react"
import { PersonalizedFeed } from "@/components/personalized-feed"
import { RecommendationDebug } from "@/components/recommendation-debug"

export default function Dashboard() {
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [trendingNews, setTrendingNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("trending")

  // Mock user analytics data
  const [userAnalytics] = useState({
    articlesRead: 47,
    timeSpent: "2h 34m",
    favoriteCategories: ["Technology", "Business", "Science"],
    readingStreak: 12,
  })

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log("Loading dashboard data...")

        // Fetch trending news from multiple categories
        const [generalNews, businessNews, techNews, healthNews] = await Promise.all([
          fetchNews({ category: "general", pageSize: 10, country: "us" }),
          fetchNews({ category: "business", pageSize: 8, country: "us" }),
          fetchNews({ category: "technology", pageSize: 8, country: "us" }),
          fetchNews({ category: "health", pageSize: 6, country: "us" }),
        ])

        // Mix and sort articles by recency
        const allArticles = [...generalNews, ...businessNews, ...techNews, ...healthNews]
        const mixedArticles = allArticles
          .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
          .slice(0, 20)

        // Use top articles for trending
        const trending = mixedArticles.slice(0, 8)

        setNewsArticles(mixedArticles)
        setTrendingNews(trending)

        console.log(`Dashboard loaded with ${mixedArticles.length} articles`)
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
        setError("Unable to load dashboard data. Please check your connection and try again.")
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Refresh dashboard data
  const refreshDashboard = async () => {
    setRefreshing(true)
    try {
      // Clear any existing error
      setError(null)

      // Reload data
      const [generalNews, businessNews, techNews] = await Promise.all([
        fetchNews({ category: "general", pageSize: 10, country: "us", forceRefresh: true }),
        fetchNews({ category: "business", pageSize: 8, country: "us", forceRefresh: true }),
        fetchNews({ category: "technology", pageSize: 8, country: "us", forceRefresh: true }),
      ])

      const allArticles = [...generalNews, ...businessNews, ...techNews]
      const mixedArticles = allArticles
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 20)

      setNewsArticles(mixedArticles)
      setTrendingNews(mixedArticles.slice(0, 8))

      console.log("Dashboard refreshed successfully")
    } catch (error) {
      console.error("Failed to refresh dashboard:", error)
      setError("Failed to refresh dashboard data.")
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
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="ml-2 text-xl">Loading your dashboard...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
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
              <Link href="/dashboard" className="text-primary font-medium">
                Dashboard
              </Link>
              <Link href="/topics" className="hover:text-primary transition-colors">
                Topics
              </Link>
              <Link href="/fact-check" className="hover:text-primary transition-colors">
                Fact Check
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshDashboard}
              disabled={refreshing}
              className="border-gray-700 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Status Alerts - Only show if there's an actual error */}
        {error && (
          <Alert className="mb-6 bg-red-900/20 border-red-600">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your News Dashboard</h1>
          <p className="text-gray-400">Personalized news feed based on your reading preferences</p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Articles Read</p>
                  <p className="text-2xl font-bold">{userAnalytics.articlesRead}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Time Spent</p>
                  <p className="text-2xl font-bold">{userAnalytics.timeSpent}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Reading Streak</p>
                  <p className="text-2xl font-bold">{userAnalytics.readingStreak} days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-400">Top Category</p>
                  <p className="text-2xl font-bold">{userAnalytics.favoriteCategories[0]}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-[#1a1a1a] border-gray-800">
            <TabsTrigger value="trending" className="data-[state=active]:bg-primary">
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="personalized" className="data-[state=active]:bg-primary">
              <User className="h-4 w-4 mr-2" />
              For You
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Trending Tab */}
          <TabsContent value="trending" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Trending News</h2>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-gray-700 bg-transparent">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" className="border-gray-700 bg-transparent">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {trendingNews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingNews.map((article, index) => (
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
                          <Badge className="bg-primary text-white text-xs">#{index + 1} Trending</Badge>
                        </div>
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-[#121212]/80 backdrop-blur-sm text-white text-xs">
                            {article.source.name}
                          </Badge>
                        </div>
                        {article.credibilityScore && (
                          <div className="absolute bottom-2 right-2">
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
            ) : (
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardContent className="p-8 text-center">
                  <TrendingUp className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Trending News Available</h3>
                  <p className="text-gray-400 mb-4">
                    Unable to load trending news. Please check your connection and try again.
                  </p>
                  <Button onClick={refreshDashboard} disabled={refreshing}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Personalized Tab */}
          <TabsContent value="personalized" className="space-y-6">
            <PersonalizedFeed />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Reading Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Technology</span>
                        <span>45%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "45%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Business</span>
                        <span>30%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "30%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Science</span>
                        <span>25%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: "25%" }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1a1a1a] border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Eye className="h-5 w-5 mr-2" />
                    Reading Habits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Average read time</span>
                      <span className="text-sm font-medium">3.2 minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Articles per day</span>
                      <span className="text-sm font-medium">8.5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Most active time</span>
                      <span className="text-sm font-medium">9:00 AM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Completion rate</span>
                      <span className="text-sm font-medium">78%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendation Debug Component */}
            <RecommendationDebug />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

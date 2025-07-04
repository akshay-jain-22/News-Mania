"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { PersonalizedFeed } from "@/components/personalized-feed"
import { RecommendationDebug } from "@/components/recommendation-debug"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, RefreshCw, AlertCircle, Sparkles, TrendingUp, Settings, BarChart3, Brain } from "lucide-react"
import { fetchNews } from "@/lib/news-api"
import type { NewsArticle } from "@/types/news"
import { useToast } from "@/components/ui/use-toast"
import NewsCard from "@/components/news-card" // Import NewsCard component

export default function DashboardPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("personalized")
  const { toast } = useToast()

  // Mock user ID for demo - in production, get from auth
  useEffect(() => {
    // Simulate getting user ID from authentication
    const mockUserId = "user_" + Math.random().toString(36).substr(2, 9)
    setUserId(mockUserId)
  }, [])

  const loadNews = async (isRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      console.log("Loading news for dashboard...")
      const newArticles = await fetchNews({
        pageSize: 20,
        page: 1,
        forceRefresh: isRefresh,
      })

      console.log(`Loaded ${newArticles.length} articles`)
      setArticles(newArticles)

      if (isRefresh) {
        toast({
          title: "News refreshed",
          description: `Loaded ${newArticles.length} fresh articles`,
        })
      }
    } catch (error) {
      console.error("Error loading news:", error)
      setError("Failed to load news. Please check your internet connection and try again.")

      toast({
        variant: "destructive",
        title: "Error loading news",
        description: "Please check your connection and try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await loadNews(true)
  }

  useEffect(() => {
    loadNews()
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />

      <main className="flex-1 py-6">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                  Personalized News Dashboard
                </h1>
                <p className="text-muted-foreground">AI-powered news recommendations tailored just for you</p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleRefresh} disabled={loading} variant="outline">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Refresh
                </Button>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Personalization Status */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Brain className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">AI Personalization Active</h3>
                      <p className="text-sm text-blue-700">Learning from your reading patterns</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                      Online
                    </Badge>
                    {userId && (
                      <Badge variant="outline" className="text-xs">
                        ID: {userId.slice(-6)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for different views */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personalized" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Personalized
                </TabsTrigger>
                <TabsTrigger value="trending" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Trending
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personalized" className="space-y-6">
                <PersonalizedFeed userId={userId} articles={articles} />
                {process.env.NODE_ENV === "development" && userId && (
                  <RecommendationDebug personalizedFeed={null} userId={userId} />
                )}
              </TabsContent>

              <TabsContent value="trending" className="space-y-6">
                {/* Loading State */}
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading trending news...</p>
                    </div>
                  </div>
                )}

                {/* Trending News Grid */}
                {!loading && articles.length > 0 && (
                  <div className="masonry-grid">
                    {articles.map((article) => (
                      <div key={article.id} className="masonry-item">
                        <NewsCard article={article} />
                      </div>
                    ))}
                  </div>
                )}

                {/* No Articles State */}
                {!loading && articles.length === 0 && !error && (
                  <div className="text-center py-12">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-muted-foreground mb-4">No trending articles available</p>
                    <Button onClick={() => loadNews(true)}>Try Again</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Reading Time Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">12m 34s</div>
                      <p className="text-xs text-muted-foreground">+2m from yesterday</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Articles Read</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">8</div>
                      <p className="text-xs text-muted-foreground">+3 from yesterday</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Personalization Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">87%</div>
                      <p className="text-xs text-muted-foreground">Excellent match</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Interest Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { category: "Technology", percentage: 35, color: "bg-blue-500" },
                        { category: "Business", percentage: 28, color: "bg-green-500" },
                        { category: "Science", percentage: 20, color: "bg-purple-500" },
                        { category: "Politics", percentage: 17, color: "bg-red-500" },
                      ].map((item) => (
                        <div key={item.category} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{item.category}</span>
                            <span>{item.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${item.color}`}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

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

"use client"

import { useState, useEffect } from "react"
import { NewsCard } from "@/components/news-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, TrendingUp, Clock, Globe, Zap } from "lucide-react"
import type { NewsArticle } from "@/types/news"
import Link from "next/link"
import { Header } from "@/components/header"
import { fetchNews } from "@/lib/news-api"

export default function HomePage() {
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([])
  const [featuredArticle, setFeaturedArticle] = useState<NewsArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadNewsData()
  }, [])

  const loadNewsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const articles = await fetchNews()

      if (articles && articles.length > 0) {
        setFeaturedArticle(articles[0])
        setLatestNews(articles.slice(1))
      } else {
        setError("No articles available")
      }
    } catch (error) {
      console.error("Error loading news:", error)
      setError("Failed to load news")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-xl">Loading your news feed...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {error && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Page Title */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Welcome to NewsMania</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your trusted source for the latest news, powered by AI insights and fact-checking
          </p>
        </div>

        {/* Featured Article */}
        {featuredArticle && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-red-500" />
              <h2 className="text-2xl font-bold">Breaking News</h2>
              <Badge className="bg-red-600 text-white">LIVE</Badge>
            </div>
            <Card className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-500/30 overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                  <div className="aspect-video lg:aspect-auto relative">
                    <img
                      src={featuredArticle.urlToImage || "/placeholder.svg?height=400&width=600&text=Featured+News"}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-red-600 text-white">
                        <Clock className="h-3 w-3 mr-1" />
                        Breaking
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col justify-center">
                    <Badge className="w-fit mb-3 bg-red-600 text-white">
                      {typeof featuredArticle.source === "string"
                        ? featuredArticle.source
                        : featuredArticle.source.name}
                    </Badge>
                    <h3 className="text-2xl font-bold mb-4">{featuredArticle.title}</h3>
                    <p className="text-muted-foreground mb-6 text-lg">{featuredArticle.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {new Date(featuredArticle.publishedAt).toLocaleDateString()}
                      </span>
                      <Button asChild className="bg-red-600 hover:bg-red-700">
                        <Link href={featuredArticle.url} target="_blank" rel="noopener noreferrer">
                          Read Full Story
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Latest News Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              <h2 className="text-2xl font-bold">Latest News</h2>
            </div>
            <Button variant="outline" asChild>
              <Link href="/topics">View All Topics</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestNews.map((article) => (
              <NewsCard
                key={article.id || article.url}
                article={article}
                onInteraction={(action, articleId, timeSpent) => {
                  console.log(`User ${action} article ${articleId}`, { timeSpent })
                }}
              />
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button asChild variant="outline" className="border-purple-500 bg-transparent">
                  <Link href="/topics">
                    <Globe className="h-4 w-4 mr-2" />
                    Browse Topics
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-blue-500 bg-transparent">
                  <Link href="/search">
                    <Globe className="h-4 w-4 mr-2" />
                    Search News
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-green-500 bg-transparent">
                  <Link href="/ai-chat">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    AI Chat
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-orange-500 bg-transparent">
                  <Link href="/notes">
                    <Clock className="h-4 w-4 mr-2" />
                    My Notes
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}

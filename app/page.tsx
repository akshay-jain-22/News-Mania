"use client"

import { useState, useEffect } from "react"
import { NewsCard } from "@/components/news-card"
import { PersonalizedNewsSection } from "@/components/personalized-news-section"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, TrendingUp, Clock, Globe, Zap } from "lucide-react"
import type { NewsArticle } from "@/types/news"
import Link from "next/link"
import { Header } from "@/components/header"
import { NewsGrid } from "@/components/news-grid"
import { fetchNews } from "@/lib/news-api"

export default async function HomePage() {
  const articles = await fetchNews()
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

      // Try to fetch from news API, fallback to sample data
      let newsResponse
      try {
        newsResponse = await fetch("/api/news?category=general&pageSize=12")
      } catch (apiError) {
        console.log("News API failed, using sample data")
        newsResponse = null
      }

      if (newsResponse && newsResponse.ok) {
        const newsData = await newsResponse.json()
        if (newsData.articles && newsData.articles.length > 0) {
          setFeaturedArticle(newsData.articles[0])
          setLatestNews(newsData.articles.slice(1))
        } else {
          loadSampleData()
        }
      } else {
        loadSampleData()
      }
    } catch (error) {
      console.error("Error loading news:", error)
      loadSampleData()
      setError("Using sample news data")
    } finally {
      setLoading(false)
    }
  }

  const loadSampleData = () => {
    const sampleArticles: NewsArticle[] = [
      {
        id: "featured-1",
        title: "Breaking: Major Technology Breakthrough Announced",
        description: "Scientists reveal groundbreaking discovery that could revolutionize the tech industry.",
        url: "https://example.com/tech-breakthrough",
        urlToImage: "/ai-technology-news.png",
        publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        source: { name: "Tech News" },
        content: "In a major announcement today, researchers have unveiled...",
      },
      {
        id: "news-1",
        title: "Global Climate Summit Reaches Historic Agreement",
        description: "World leaders unite on ambitious climate targets in unprecedented cooperation.",
        url: "https://example.com/climate-summit",
        urlToImage: "/climate-summit-leaders.png",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: { name: "Global News" },
        content: "World leaders have reached a historic agreement...",
      },
      {
        id: "news-2",
        title: "Economic Markets Show Strong Recovery",
        description: "Financial analysts report positive indicators across global markets.",
        url: "https://example.com/market-recovery",
        urlToImage: "/financial-markets-economy-growth.png",
        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        source: { name: "Business Today" },
        content: "Global markets are showing strong signs of recovery...",
      },
      {
        id: "news-3",
        title: "Medical Breakthrough in Cancer Research",
        description: "New treatment shows promising results in clinical trials.",
        url: "https://example.com/cancer-research",
        urlToImage: "/placeholder.svg?height=200&width=300&text=Medical+Research",
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: { name: "Health Journal" },
        content: "Researchers have developed a new approach to cancer treatment...",
      },
      {
        id: "news-4",
        title: "Space Mission Discovers New Exoplanet",
        description: "Astronomers identify potentially habitable world in distant solar system.",
        url: "https://example.com/exoplanet-discovery",
        urlToImage: "/mars-rover-exploration.png",
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        source: { name: "Space News" },
        content: "A new exoplanet has been discovered that shows signs...",
      },
      {
        id: "news-5",
        title: "Renewable Energy Milestone Achieved",
        description: "Solar and wind power reach new efficiency records worldwide.",
        url: "https://example.com/renewable-energy",
        urlToImage: "/placeholder.svg?height=200&width=300&text=Renewable+Energy",
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: { name: "Energy Today" },
        content: "Renewable energy sources have achieved unprecedented efficiency...",
      },
    ]

    setFeaturedArticle(sampleArticles[0])
    setLatestNews(sampleArticles.slice(1))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-xl">Loading your personalized news feed...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container py-8">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Welcome to NewsMania</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your trusted source for the latest news, powered by AI insights and fact-checking
            </p>
          </div>

          <NewsGrid articles={articles} title="Latest News" />

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
                        src={featuredArticle.urlToImage || "/placeholder.svg?height=400&width=600"}
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
                      <Badge className="w-fit mb-3 bg-red-600 text-white">{featuredArticle.source.name}</Badge>
                      <h3 className="text-2xl font-bold mb-4 text-white">{featuredArticle.title}</h3>
                      <p className="text-gray-300 mb-6 text-lg">{featuredArticle.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">
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

          {/* For You - AI Personalized Section */}
          <section>
            <PersonalizedNewsSection />
          </section>

          {/* Latest News */}
          <section>
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
                    <Link href="/ai-personalized">
                      <Zap className="h-4 w-4 mr-2" />
                      For You Feed
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-blue-500 bg-transparent">
                    <Link href="/fact-check">
                      <Globe className="h-4 w-4 mr-2" />
                      Fact Check
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="border-green-500 bg-transparent">
                    <Link href="/extract">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Extract News
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
        </div>
      </main>
    </div>
  )
}

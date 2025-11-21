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
import { getNews } from "@/lib/getNews"
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
  Sparkles,
  Radio,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useI18n } from "@/lib/i18n"

export default function Home() {
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [trendingNews, setTrendingNews] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { t, locale } = useI18n()

  const categories = [
    { id: "business", name: t("categories.business") || "BUSINESS" },
    { id: "technology", name: t("categories.technology") || "TECH" },
    { id: "health", name: t("categories.health") || "HEALTH" },
    { id: "sports", name: t("categories.sports") || "SPORTS" },
    { id: "science", name: t("categories.science") || "SCIENCE" },
    { id: "entertainment", name: t("categories.entertainment") || "ENTERTAINMENT" },
  ]

  useEffect(() => {
    const loadAllNews = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log(`[v0] Loading news for language: ${locale}`)

        const languageMap: Record<string, "English" | "Hindi" | "Kannada"> = {
          en: "English",
          hi: "Hindi",
          kn: "Kannada",
        }
        const language = languageMap[locale] || "English"

        console.log(`[v0] Fetching news for ${language}`)

        if (language === "English") {
          const newsPromises = [
            fetchNews({ category: "general", pageSize: 15, country: "us" }),
            fetchNews({ category: "business", pageSize: 10, country: "us" }),
            fetchNews({ category: "technology", pageSize: 10, country: "us" }),
            fetchNews({ category: "health", pageSize: 8, country: "us" }),
            fetchNews({ category: "sports", pageSize: 8, country: "us" }),
          ]

          const [generalNews, businessNews, techNews, healthNews, sportsNews] = await Promise.all(newsPromises)
          const allArticles = [...generalNews, ...businessNews, ...techNews, ...healthNews, ...sportsNews]
          const shuffledArticles = allArticles.sort(() => Math.random() - 0.5)
          const trending = shuffledArticles.slice(0, 5)

          setNewsArticles(shuffledArticles)
          setTrendingNews(trending)
          setPage(2)

          console.log(`[v0] Loaded ${shuffledArticles.length} English articles`)
        } else {
          const newsPromises = [
            getNews({ language, country: "in", pageSize: 15 }),
            getNews({ language, country: "in", category: "business", pageSize: 10 }),
            getNews({ language, country: "in", category: "technology", pageSize: 10 }),
            getNews({ language, country: "in", category: "health", pageSize: 8 }),
            getNews({ language, country: "in", category: "sports", pageSize: 8 }),
          ]

          const results = await Promise.all(newsPromises)
          const allArticles = results.flat()
          const shuffledArticles = allArticles.sort(() => Math.random() - 0.5)
          const trending = shuffledArticles.slice(0, 5)

          setNewsArticles(shuffledArticles)
          setTrendingNews(trending)
          setPage(2)

          console.log(`[v0] Loaded ${shuffledArticles.length} ${language} articles`)
        }
      } catch (error) {
        console.error("[v0] Failed to load news:", error)
        setError("Unable to load news at the moment. Please check your internet connection and try again.")
      } finally {
        setLoading(false)
      }
    }

    loadAllNews()
  }, [locale]) // Re-fetch when language changes

  // Load more mixed news
  const loadMoreNews = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      console.log(`Loading more mixed news, page ${page}`)

      const moreArticles = await fetchNews({
        category: "general",
        pageSize: 10,
        page,
        country: "us",
      })

      if (moreArticles.length > 0) {
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

  useEffect(() => {
    document.title = `${t("app.name")} - ${t("home.latestNews")}`
  }, [t])

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top Navigation Bar */}
      <div className="bg-[#1a1a1a] py-2 px-4 hidden md:block border-b border-gray-800">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6 text-xs">
            {categories.map((category) => (
              <Link key={category.id} href={`/topics/${category.id}`} className="hover:text-primary transition-colors">
                {t(`categories.${category.id.toLowerCase()}`) || category.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/research">{t("nav.research") || "RESEARCH"}</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/dashboard">{t("nav.dashboard") || "DASHBOARD"}</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="bg-[#121212] border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-2xl font-bold">{t("app.name") || "NewsMania"}</span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-primary font-medium">
                {t("nav.latest") || "Latest"}
              </Link>
              <Link href="/personalized" className="hover:text-primary transition-colors">
                {t("nav.personalized") || "Personalized"}
              </Link>
              <Link href="/topics" className="hover:text-primary transition-colors">
                {t("nav.topics") || "Topics"}
              </Link>
              <Link href="/fact-check" className="hover:text-primary transition-colors">
                {t("nav.factCheck") || "Fact Check"}
              </Link>
              <Link href="/extract" className="hover:text-primary transition-colors">
                {t("nav.extract") || "Extract News"}
              </Link>
              <Link href="/notes" className="hover:text-primary transition-colors">
                {t("nav.myNotes") || "My Notes"}
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">{t("nav.dashboard") || "Dashboard"}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth">{t("auth.signIn") || "Sign In"}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Status Alert - Only show if there's an actual error */}
        {error && (
          <Alert className="mb-6 bg-red-900/20 border-red-600">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="ml-2 text-xl">{t("common.loading") || "Loading latest news..."}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {/* Hero Section */}
              <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                  <h1 className="text-4xl md:text-5xl font-bold mb-2">{t("home.latestNews")}</h1>
                  <p className="text-muted-foreground text-lg">{t("home.breakingNews")}</p>
                </div>
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

              {/* News Grid - 3 columns on desktop, 2 on tablet, 1 on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {newsArticles.slice(1).map((article) => (
                  <Card
                    key={article.id}
                    className="bg-[#1a1a1a] border-gray-800 overflow-hidden group hover:border-gray-700 transition-all hover:shadow-lg"
                  >
                    <Link href={article.url} target="_blank" rel="noopener noreferrer">
                      <div className="relative aspect-video overflow-hidden">
                        <Image
                          src={article.urlToImage || "/placeholder.svg?height=200&width=300"}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105 duration-300"
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
                              className="text-gray-500 hover:text-primary transition-colors"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                            >
                              <MessageSquare className="h-3 w-3" />
                            </button>
                            <button
                              className="text-gray-500 hover:text-primary transition-colors"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                            >
                              <Bookmark className="h-3 w-3" />
                            </button>
                            <button
                              className="text-gray-500 hover:text-primary transition-colors"
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
              <Card className="bg-card border rounded-lg p-6 mb-6 sticky top-20">
                <CardHeader>
                  <div className="flex items-center">
                    <Radio className="h-5 w-5 text-green-500 animate-pulse" />
                    <h3 className="text-lg font-semibold">{t("home.liveFeed")}</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{t("home.connectedToSources")}</p>
                </CardContent>
              </Card>

              {/* Trending News */}
              <Card className="bg-card border rounded-lg p-6 mb-6">
                <CardHeader>
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">{t("sidebar.trendingNow") || "Trending Now"}</h3>
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

              {/* Quick Actions */}
              <Card className="bg-card border rounded-lg p-6 mb-6">
                <CardHeader>
                  <h3 className="text-lg font-semibold">{t("home.quickActions")}</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-start" variant="ghost">
                    <Link href="/fact-check">
                      <Shield className="h-4 w-4 mr-2" />
                      {t("nav.factCheck") || "Fact Check News"}
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="ghost">
                    <Link href="/extract">
                      <Zap className="h-4 w-4 mr-2" />
                      {t("nav.extract") || "Extract Article"}
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="ghost">
                    <Link href="/notes">
                      <Bookmark className="h-4 w-4 mr-2" />
                      {t("nav.myNotes") || "My Saved Notes"}
                    </Link>
                  </Button>
                  <Button asChild className="w-full justify-start" variant="ghost">
                    <Link href="/search">
                      <Globe className="h-4 w-4 mr-2" />
                      {t("nav.search") || "Search News"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Categories Quick Access */}
              <Card className="bg-card border rounded-lg p-6 mb-6">
                <CardHeader>
                  <h3 className="text-lg font-semibold">{t("sidebar.browseCategories") || "Browse Categories"}</h3>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { id: "business", name: t("categories.business") || "Business", icon: Briefcase },
                    { id: "technology", name: t("categories.technology") || "Technology", icon: Monitor },
                    { id: "health", name: t("categories.health") || "Health", icon: Heart },
                    { id: "sports", name: t("categories.sports") || "Sports", icon: Trophy },
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
              <Card className="bg-card border rounded-lg p-6">
                <CardHeader>
                  <h3 className="text-lg font-semibold">{t("sidebar.stayUpdated") || "Stay Updated"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("sidebar.newsletter") || "Get the latest news delivered to your inbox"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input
                    type="email"
                    placeholder={t("common.yourEmail") || "Your email address"}
                    className="w-full px-3 py-2 bg-[#2e2e2e] border border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                  />
                  <Button className="w-full">{t("common.subscribe") || "Subscribe"}</Button>
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
              <h3 className="text-lg font-bold mb-4">{t("app.name") || "NewsMania"}</h3>
              <p className="text-sm text-gray-400 mb-4">
                {t("footer.trustedSource") ||
                  "Your trusted source for breaking news, in-depth reporting, and fact-checked journalism powered by AI."}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">{t("footer.quickLinks") || "Quick Links"}</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/topics" className="text-gray-400 hover:text-primary transition-colors">
                    {t("nav.topics") || "Topics"}
                  </Link>
                </li>
                <li>
                  <Link href="/fact-check" className="text-gray-400 hover:text-primary transition-colors">
                    {t("nav.factCheck") || "Fact Check"}
                  </Link>
                </li>
                <li>
                  <Link href="/research" className="text-gray-400 hover:text-primary transition-colors">
                    {t("nav.research") || "Research"}
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-gray-400 hover:text-primary transition-colors">
                    {t("nav.dashboard") || "Dashboard"}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">{t("footer.categories") || "Categories"}</h3>
              <ul className="space-y-2 text-sm">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/topics/${category.id}`}
                      className="text-gray-400 hover:text-primary transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>
              {t("footer.copyright") || "© 2025 NewsMania. All rights reserved. Powered by AI-driven news curation."}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

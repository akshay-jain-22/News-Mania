"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { fetchNews } from "@/lib/news-api"
import { formatDistanceToNow } from "@/lib/utils"
import type { NewsArticle } from "@/types/news"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ChevronRight, Clock, Rss, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock data for when API fails
const MOCK_FEATURED_ARTICLE: NewsArticle = {
  id: "featured-1",
  source: { id: "newsmania", name: "NewsMania" },
  author: "NewsMania Editorial",
  title: "Breaking: Major Technology Breakthrough Announced in AI Research",
  description:
    "Scientists have made a significant breakthrough in artificial intelligence research that could revolutionize how we interact with technology in our daily lives.",
  url: "#",
  urlToImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&h=675&fit=crop",
  publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  content: "This is a comprehensive article about the latest breakthrough in AI research...",
  credibilityScore: 85,
  isFactChecked: true,
  factCheckResult: null,
}

const MOCK_NEWS_ARTICLES: NewsArticle[] = [
  {
    id: "mock-1",
    source: { id: "tech-news", name: "Tech News" },
    author: "Tech Reporter",
    title: "Global Markets Show Strong Performance Despite Economic Uncertainty",
    description: "Financial markets worldwide are showing resilience amid ongoing economic challenges.",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop",
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    content: "Market analysis shows...",
    credibilityScore: 78,
    isFactChecked: false,
    factCheckResult: null,
  },
  {
    id: "mock-2",
    source: { id: "health-today", name: "Health Today" },
    author: "Health Reporter",
    title: "New Study Reveals Promising Results for Cancer Treatment",
    description: "Medical researchers announce breakthrough findings in cancer therapy research.",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=500&fit=crop",
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    content: "The study conducted over two years...",
    credibilityScore: 92,
    isFactChecked: true,
    factCheckResult: null,
  },
  {
    id: "mock-3",
    source: { id: "sports-central", name: "Sports Central" },
    author: "Sports Desk",
    title: "Championship Finals Set Record Viewership Numbers",
    description: "The latest championship finals have broken all previous viewership records.",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=500&fit=crop",
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    content: "Sports fans around the world...",
    credibilityScore: 75,
    isFactChecked: false,
    factCheckResult: null,
  },
  {
    id: "mock-4",
    source: { id: "world-news", name: "World News" },
    author: "International Correspondent",
    title: "Climate Summit Reaches Historic Agreement on Emissions",
    description: "World leaders agree on ambitious new targets for reducing carbon emissions.",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=500&fit=crop",
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    content: "The climate summit concluded with...",
    credibilityScore: 88,
    isFactChecked: true,
    factCheckResult: null,
  },
  {
    id: "mock-5",
    source: { id: "business-wire", name: "Business Wire" },
    author: "Business Reporter",
    title: "Tech Giant Announces Revolutionary Smartphone Features",
    description: "Latest smartphone release includes groundbreaking technology and sustainability features.",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=500&fit=crop",
    publishedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    content: "The new smartphone features...",
    credibilityScore: 82,
    isFactChecked: false,
    factCheckResult: null,
  },
  {
    id: "mock-6",
    source: { id: "science-daily", name: "Science Daily" },
    author: "Science Editor",
    title: "Space Mission Discovers Potential Signs of Life on Mars",
    description: "Latest Mars rover findings suggest possible microbial life in ancient rock formations.",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&h=500&fit=crop",
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    content: "The Mars rover has detected...",
    credibilityScore: 95,
    isFactChecked: true,
    factCheckResult: null,
  },
  {
    id: "mock-7",
    source: { id: "entertainment-weekly", name: "Entertainment Weekly" },
    author: "Entertainment Reporter",
    title: "Film Festival Showcases Groundbreaking Independent Cinema",
    description: "This year's film festival features diverse storytelling and innovative filmmaking techniques.",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1603190287605-e6ade32fa852?w=800&h=500&fit=crop",
    publishedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    content: "The film festival opened with...",
    credibilityScore: 73,
    isFactChecked: false,
    factCheckResult: null,
  },
  {
    id: "mock-8",
    source: { id: "auto-news", name: "Auto News" },
    author: "Automotive Correspondent",
    title: "Electric Vehicle Sales Surge to Record Highs Globally",
    description: "Electric vehicle adoption accelerates as charging infrastructure expands worldwide.",
    url: "#",
    urlToImage: "https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=800&h=500&fit=crop",
    publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    content: "Electric vehicle manufacturers report...",
    credibilityScore: 86,
    isFactChecked: true,
    factCheckResult: null,
  },
]

export default function Home() {
  const [topNews, setTopNews] = useState<NewsArticle[]>([])
  const [categoryNews, setCategoryNews] = useState<Record<string, NewsArticle[]>>({})
  const [loading, setLoading] = useState(true)
  const [featuredArticle, setFeaturedArticle] = useState<NewsArticle | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)

  const categories = [
    { id: "general", name: "Top Stories" },
    { id: "world", name: "World" },
    { id: "business", name: "Business" },
    { id: "technology", name: "Tech" },
    { id: "entertainment", name: "Entertainment" },
    { id: "sports", name: "Sports" },
    { id: "science", name: "Science" },
    { id: "health", name: "Health" },
  ]

  useEffect(() => {
    const loadNews = async () => {
      try {
        console.log("Loading news data...")

        // Try to fetch real news first
        const topNewsData = await fetchNews({ pageSize: 10 })

        if (topNewsData && topNewsData.length > 0) {
          console.log("Successfully loaded real news data")
          setTopNews(topNewsData)
          setFeaturedArticle(topNewsData[0])
          setApiError(null)

          // Fetch news for each category
          const categoryPromises = categories.map(async (category) => {
            try {
              return await fetchNews({
                category: category.id === "general" ? undefined : category.id,
                pageSize: 4,
              })
            } catch (error) {
              console.warn(`Failed to load ${category.name} news, using mock data`)
              return MOCK_NEWS_ARTICLES.slice(0, 4)
            }
          })

          const categoryResults = await Promise.all(categoryPromises)
          const categoryNewsMap: Record<string, NewsArticle[]> = {}
          categories.forEach((category, index) => {
            categoryNewsMap[category.id] = categoryResults[index]
          })
          setCategoryNews(categoryNewsMap)
        } else {
          throw new Error("No news data received")
        }
      } catch (error) {
        console.warn("News API failed, using mock data:", error)
        setApiError("Using demo content - News API temporarily unavailable")

        // Use mock data as fallback
        setTopNews(MOCK_NEWS_ARTICLES)
        setFeaturedArticle(MOCK_FEATURED_ARTICLE)

        // Set mock data for all categories
        const mockCategoryNews: Record<string, NewsArticle[]> = {}
        categories.forEach((category) => {
          mockCategoryNews[category.id] = MOCK_NEWS_ARTICLES.slice(0, 4)
        })
        setCategoryNews(mockCategoryNews)
      } finally {
        setLoading(false)
      }
    }

    loadNews()
  }, [])

  // Function to get a category-specific placeholder image
  function getCategoryPlaceholder(category: string): string {
    const categoryImages: Record<string, string[]> = {
      business: [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=500&fit=crop",
      ],
      technology: [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=500&fit=crop",
      ],
      sports: [
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=500&fit=crop",
      ],
      health: [
        "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&h=500&fit=crop",
      ],
      science: [
        "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1564325724739-bae0bd08762c?w=800&h=500&fit=crop",
      ],
      entertainment: [
        "https://images.unsplash.com/photo-1603190287605-e6ade32fa852?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop",
      ],
      world: [
        "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&h=500&fit=crop",
      ],
      general: [
        "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=500&fit=crop",
      ],
    }

    const images = categoryImages[category] || categoryImages.general
    return images[Math.floor(Math.random() * images.length)]
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Top Navigation Bar */}
      <div className="bg-[#2e2e2e] py-2 px-4 hidden md:block">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6 text-xs">
            {["WORLD", "BUSINESS", "TECH", "HEALTH", "SPORTS", "SCIENCE", "ENTERTAINMENT", "LIFESTYLE"].map((item) => (
              <Link key={item} href={`/topics/${item.toLowerCase()}`} className="hover:text-primary transition-colors">
                {item}
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
      <header className="bg-[#1a1a1a] border-b border-gray-800 sticky top-0 z-50">
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
              <Link href="/world" className="hover:text-primary transition-colors">
                World
              </Link>
              <Link href="/fact-check" className="hover:text-primary transition-colors">
                Fact Check
              </Link>
              <Link href="/videos" className="hover:text-primary transition-colors">
                Videos
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
        {/* API Error Alert */}
        {apiError && (
          <Alert className="mb-6 bg-yellow-900/20 border-yellow-600">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-yellow-200">{apiError}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 aspect-[16/9] bg-gray-800 animate-pulse rounded-md"></div>
            <div className="space-y-4">
              <div className="aspect-video bg-gray-800 animate-pulse rounded-md"></div>
              <div className="aspect-video bg-gray-800 animate-pulse rounded-md"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Featured Article and Top Stories */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Main Featured Article */}
              {featuredArticle && (
                <div className="md:col-span-2 relative group">
                  <Link href={featuredArticle.url === "#" ? `/article/${featuredArticle.id}` : featuredArticle.url}>
                    <div className="relative aspect-[16/9] overflow-hidden rounded-md">
                      <Image
                        src={featuredArticle.urlToImage || getCategoryPlaceholder("general")}
                        alt={featuredArticle.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                      <Badge className="mb-2 bg-primary text-white">{featuredArticle.source.name}</Badge>
                      <h1 className="text-xl md:text-3xl font-bold text-white mb-2 line-clamp-3">
                        {featuredArticle.title}
                      </h1>
                      <p className="text-sm md:text-base text-gray-200 line-clamp-2 mb-2">
                        {featuredArticle.description}
                      </p>
                      <div className="flex items-center text-xs text-gray-300">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(featuredArticle.publishedAt))} ago
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Side Stories */}
              <div className="space-y-4">
                {topNews.slice(1, 4).map((article, index) => (
                  <Link
                    key={index}
                    href={article.url === "#" ? `/article/${article.id}` : article.url}
                    className="group block"
                  >
                    <div className="relative aspect-video overflow-hidden rounded-md">
                      <Image
                        src={article.urlToImage || getCategoryPlaceholder("general")}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <Badge className="mb-1 text-xs">{article.source.name}</Badge>
                        <h2 className="text-sm font-bold text-white line-clamp-2">{article.title}</h2>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Category Tabs */}
            <Tabs defaultValue="general" className="mb-8">
              <TabsList className="bg-[#1a1a1a] border-b border-gray-800 p-0 h-auto">
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-white rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category.id} value={category.id} className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {categoryNews[category.id]?.slice(0, 4).map((article, index) => (
                      <Card key={index} className="bg-[#1a1a1a] border-gray-800 overflow-hidden group">
                        <Link href={article.url === "#" ? `/article/${article.id}` : article.url}>
                          <div className="relative aspect-[4/3] overflow-hidden">
                            <Image
                              src={article.urlToImage || getCategoryPlaceholder(category.id)}
                              alt={article.title}
                              fill
                              className="object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline" className="text-xs">
                                {article.source.name}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {formatDistanceToNow(new Date(article.publishedAt))} ago
                              </span>
                            </div>
                            <h3 className="font-bold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                              {article.title}
                            </h3>
                            <p className="text-sm text-gray-400 line-clamp-2">{article.description}</p>
                          </div>
                        </Link>
                      </Card>
                    ))}
                  </div>
                  <div className="flex justify-center mt-6">
                    <Button variant="outline" asChild>
                      <Link href={`/topics/${category.id}`}>
                        View All {category.name} News
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Featured Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Badge className="bg-red-600 text-white mr-2 uppercase">Featured</Badge>
                <h2 className="text-xl font-bold">Editor's Picks</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topNews.slice(4, 7).map((article, index) => (
                  <Card key={index} className="bg-[#1a1a1a] border-gray-800 overflow-hidden group">
                    <Link href={article.url === "#" ? `/article/${article.id}` : article.url}>
                      <div className="relative aspect-video overflow-hidden">
                        <Image
                          src={article.urlToImage || getCategoryPlaceholder("general")}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-primary text-white">{article.source.name}</Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-2">{article.description}</p>
                        <div className="flex items-center text-xs text-gray-400">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDistanceToNow(new Date(article.publishedAt))} ago
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>

            {/* Podcast/Video Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Rss className="h-5 w-5 mr-2 text-primary" />
                  <h2 className="text-xl font-bold">Latest Videos</h2>
                </div>
                <Link href="/videos" className="text-primary text-sm hover:underline">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {topNews.slice(7, 11).map((article, index) => (
                  <Card key={index} className="bg-[#1a1a1a] border-gray-800 overflow-hidden group">
                    <Link href={article.url === "#" ? `/article/${article.id}` : article.url}>
                      <div className="relative aspect-video overflow-hidden">
                        <Image
                          src={article.urlToImage || getCategoryPlaceholder("general")}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-primary/80 rounded-full p-3 opacity-90 group-hover:opacity-100 transition-opacity">
                            <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="bg-[#1a1a1a] border-t border-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">NewsMania</h3>
              <p className="text-sm text-gray-400 mb-4">
                Your trusted source for breaking news, in-depth reporting, and fact-checked journalism.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-primary">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-primary">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-primary">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </a>
              </div>
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
            <div>
              <h3 className="text-lg font-bold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-primary">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-400 hover:text-primary">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-gray-400 hover:text-primary">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/advertise" className="text-gray-400 hover:text-primary">
                    Advertise
                  </Link>
                </li>
                <li>
                  <Link href="/ethics" className="text-gray-400 hover:text-primary">
                    Ethics Policy
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
          <Separator className="my-6 bg-gray-800" />
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} NewsMania. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0 text-sm">
              <Link href="/terms" className="text-gray-400 hover:text-primary">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-primary">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

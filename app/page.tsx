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
import { Separator } from "@/components/ui/separator"
import { Clock, Bookmark, MessageSquare, Share2, Shield } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Mock data for when API fails
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
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  const categories = [
    { id: "business", name: "BUSINESS" },
    { id: "technology", name: "TECH" },
    { id: "health", name: "HEALTH" },
    { id: "sports", name: "SPORTS" },
    { id: "science", name: "SCIENCE" },
    { id: "entertainment", name: "ENTERTAINMENT" },
    { id: "lifestyle", name: "LIFESTYLE" },
  ]

  useEffect(() => {
    const loadNews = async () => {
      try {
        console.log("Loading news data...")

        // Try to fetch real news first
        const topNewsData = await fetchNews({ pageSize: 20 })

        if (topNewsData && topNewsData.length > 0) {
          console.log("Successfully loaded real news data")
          setNewsArticles(topNewsData)
          setApiError(null)
        } else {
          throw new Error("No news data received")
        }
      } catch (error) {
        console.warn("News API failed, using mock data:", error)
        setApiError("Using demo content - News API temporarily unavailable")

        // Use mock data as fallback
        setNewsArticles(MOCK_NEWS_ARTICLES)
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
      general: [
        "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=500&fit=crop",
        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=500&fit=crop",
      ],
    }

    const images = categoryImages[category] || categoryImages.general
    return images[Math.floor(Math.random() * images.length)]
  }

  // Function to render credibility badge
  const renderCredibilityBadge = (score: number) => {
    if (score >= 85) {
      return (
        <Badge className="bg-green-600 text-white">
          <Shield className="h-3 w-3 mr-1" />
          {score}%
        </Badge>
      )
    } else if (score >= 70) {
      return (
        <Badge className="bg-yellow-600 text-white">
          <Shield className="h-3 w-3 mr-1" />
          {score}%
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-red-600 text-white">
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
          <h1 className="text-3xl font-bold mb-2">Your News Feed</h1>
          <p className="text-gray-400">Personalized news and top stories combined in one feed</p>
        </div>

        {/* API Error Alert */}
        {apiError && (
          <Alert className="mb-6 bg-yellow-900/20 border-yellow-600">
            <AlertDescription className="text-yellow-200">{apiError}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          // Loading skeleton
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-[#1a1a1a] rounded-lg overflow-hidden">
                <div className="aspect-[16/9] bg-gray-800 animate-pulse"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-1/4"></div>
                  <div className="h-6 bg-gray-800 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4"></div>
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Unified news feed
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsArticles.map((article, index) => (
              <Card
                key={index}
                className="bg-[#1a1a1a] border-gray-800 overflow-hidden group hover:border-gray-700 transition-all"
              >
                <Link href={article.url === "#" ? `/article/${article.id}` : article.url}>
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={article.urlToImage || getCategoryPlaceholder("general")}
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
                  <div className="p-4">
                    <h2 className="text-lg font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{article.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(article.publishedAt))} ago
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-500 hover:text-primary">
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button className="text-gray-500 hover:text-primary">
                          <Bookmark className="h-4 w-4" />
                        </button>
                        <button className="text-gray-500 hover:text-primary">
                          <Share2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}

        {/* Load More Button */}
        <div className="flex justify-center mt-10">
          <Button variant="outline" className="border-gray-700 hover:bg-gray-800">
            Load More News
          </Button>
        </div>
      </main>

      <footer className="bg-[#121212] border-t border-gray-800 py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              </div>
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
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

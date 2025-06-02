"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle } from "lucide-react"
import { fetchNews } from "@/lib/news-api"
import { formatDistanceToNow } from "@/lib/utils"
import type { NewsArticle } from "@/types/news"

export default function Home() {
  const [featuredArticle, setFeaturedArticle] = useState<NewsArticle | null>(null)
  const [middleColumnArticles, setMiddleColumnArticles] = useState<NewsArticle[]>([])
  const [rightColumnArticles, setRightColumnArticles] = useState<NewsArticle[]>([])
  const [featuredSideArticle, setFeaturedSideArticle] = useState<NewsArticle | null>(null)
  const [podcastArticles, setPodcastArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Categories for the top navigation
  const categories = ["WORLD", "PROFIT", "HEALTH", "TECH", "GAMES", "SHOPPING", "APPS", "LIFESTYLE", "FOOD"]

  // Main navigation items
  const mainNavItems = [
    { name: "Live TV", href: "#" },
    { name: "Latest", href: "#" },
    { name: "India", href: "#" },
    { name: "World", href: "#" },
    { name: "Premium", href: "#" },
    { name: "Videos", href: "#" },
    { name: "Opinion", href: "#" },
    { name: "Cities", href: "#" },
    { name: "Auto", href: "#" },
    { name: "Web Stories", href: "#" },
    { name: "Education", href: "#" },
  ]

  // Function to create a URL-friendly slug from the article title
  function createSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .trim()
  }

  useEffect(() => {
    async function loadNews() {
      try {
        setLoading(true)
        setError(null)

        // Fetch general news for the featured article and main columns
        const generalNews = await fetchNews({ category: "general", pageSize: 15 })

        // Fetch technology news for the right column
        const techNews = await fetchNews({ category: "technology", pageSize: 5 })

        // Fetch business news for podcasts section
        const businessNews = await fetchNews({ category: "business", pageSize: 2 })

        if (generalNews.length > 0) {
          // Set the first article as the featured one
          setFeaturedArticle(generalNews[0])

          // Set the next 4 articles for the middle column
          setMiddleColumnArticles(generalNews.slice(1, 5))

          // Set the next 4 articles for the right column
          setRightColumnArticles(generalNews.slice(5, 9))

          // Set a featured side article
          setFeaturedSideArticle(techNews[0])

          // Set podcast articles
          setPodcastArticles(businessNews)
        } else {
          setError("No news articles available at the moment")
        }
      } catch (error) {
        console.error("Failed to load news:", error)
        setError("Failed to load news. Please check your internet connection and try again.")
      } finally {
        setLoading(false)
      }
    }

    loadNews()
  }, [])

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Top Categories Bar */}
      <div className="bg-[#1a1a1a] py-2 hidden md:block">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-6 overflow-x-auto text-xs text-gray-300">
            {categories.map((category) => (
              <Link
                key={category}
                href={`/category/${category.toLowerCase()}`}
                className="whitespace-nowrap hover:text-white"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <header className="bg-black py-3 sticky top-0 z-50 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button className="text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-menu"
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </button>
              <Link href="/" className="text-2xl font-bold text-white">
                NewsMania
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-6 overflow-x-auto">
              {mainNavItems.map((item) => (
                <Link key={item.name} href={item.href} className="text-sm whitespace-nowrap hover:text-primary">
                  {item.name === "Live TV" ? (
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                      {item.name}
                    </span>
                  ) : (
                    item.name
                  )}
                </Link>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button className="text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-search"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>
              <button className="text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-more-horizontal"
                >
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="ml-2 text-xl">Loading latest news...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Featured Article */}
            <div className="lg:col-span-6">
              {featuredArticle && (
                <div className="relative group">
                  <Link href={`/article/${featuredArticle.id}/${createSlug(featuredArticle.title)}`}>
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={featuredArticle.urlToImage || "/placeholder.svg?height=500&width=800"}
                        alt={featuredArticle.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 line-clamp-3">
                          {featuredArticle.title}
                        </h1>
                        <p className="text-sm text-gray-200 line-clamp-2">{featuredArticle.description}</p>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Middle Column */}
            <div className="lg:col-span-3 space-y-6">
              {middleColumnArticles.map((article, index) => (
                <div key={article.id} className="group">
                  <Link href={`/article/${article.id}/${createSlug(article.title)}`}>
                    <div className="relative aspect-video overflow-hidden mb-2">
                      <Image
                        src={article.urlToImage || "/placeholder.svg?height=200&width=300"}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <h2 className="font-bold text-base mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(article.publishedAt))} ago</p>
                  </Link>
                </div>
              ))}
            </div>

            {/* Right Column */}
            <div className="lg:col-span-3 space-y-6">
              {/* Featured Side Article */}
              {featuredSideArticle && (
                <div className="relative group">
                  <Link href={`/article/${featuredSideArticle.id}/${createSlug(featuredSideArticle.title)}`}>
                    <div className="relative aspect-video overflow-hidden mb-2">
                      <Image
                        src={featuredSideArticle.urlToImage || "/placeholder.svg?height=200&width=300"}
                        alt={featuredSideArticle.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute top-0 left-0 bg-red-600 text-white text-xs font-bold px-2 py-1">
                        FEATURED
                      </div>
                    </div>
                    <h2 className="font-bold text-base mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {featuredSideArticle.title}
                    </h2>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(featuredSideArticle.publishedAt))} ago
                    </p>
                  </Link>
                </div>
              )}

              {/* Regular Articles */}
              {rightColumnArticles.map((article, index) => (
                <div key={article.id} className="group">
                  <Link href={`/article/${article.id}/${createSlug(article.title)}`}>
                    <div className="relative aspect-video overflow-hidden mb-2">
                      <Image
                        src={article.urlToImage || "/placeholder.svg?height=200&width=300"}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <h2 className="font-bold text-base mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(article.publishedAt))} ago</p>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Podcast Section */}
        {!loading && podcastArticles.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-bold">Podcast</h2>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-chevron-right ml-2"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {podcastArticles.map((article) => (
                <div key={article.id} className="flex items-center bg-[#1a1a1a] rounded-lg overflow-hidden">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <Image
                      src={article.urlToImage || "/placeholder.svg?height=100&width=100"}
                      alt={article.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <Badge className="mb-2 bg-red-600 hover:bg-red-700">{article.source.name}</Badge>
                    <h3 className="font-bold text-sm line-clamp-2">{article.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom News Grid */}
        {!loading && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...middleColumnArticles, ...rightColumnArticles].slice(0, 3).map((article) => (
              <div key={`bottom-${article.id}`} className="group">
                <Link href={`/article/${article.id}/${createSlug(article.title)}`}>
                  <div className="relative aspect-video overflow-hidden mb-2">
                    <Image
                      src={article.urlToImage || "/placeholder.svg?height=200&width=300"}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <h2 className="font-bold text-base mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(article.publishedAt))} ago</p>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-[#1a1a1a] py-8 mt-12 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-xl font-bold mb-4">NewsMania</h2>
              <p className="text-sm text-gray-400 max-w-md">
                Your trusted source for breaking news, in-depth reporting, and fact-checked journalism from around the
                world.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-bold mb-3">Categories</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  {categories.slice(0, 5).map((category) => (
                    <li key={category}>
                      <Link href={`/category/${category.toLowerCase()}`} className="hover:text-white">
                        {category}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-3">Company</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <Link href="/about" className="hover:text-white">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-white">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="/careers" className="hover:text-white">
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link href="/advertise" className="hover:text-white">
                      Advertise
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-3">Legal</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>
                    <Link href="/terms" className="hover:text-white">
                      Terms of Use
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="hover:text-white">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/cookies" className="hover:text-white">
                      Cookie Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} NewsMania. All rights reserved.</p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <Link href="#" className="text-gray-400 hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-facebook"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-twitter"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-instagram"
                >
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-youtube"
                >
                  <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                  <path d="m10 15 5-3-5-3z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

"use client"

import { NewsCard } from "@/components/news-card"
import { useState, useEffect } from "react"

interface NewsItem {
  id: string
  title: string
  description: string
  image: string
  category: string
  date: string
  source: string
}

// Mock data - replace with actual API calls
const MOCK_NEWS: NewsItem[] = [
  {
    id: "1",
    title: "Breaking: New AI Breakthrough Announced",
    description:
      "Scientists announce major advancement in artificial intelligence research with potential to transform multiple industries.",
    image: "https://images.unsplash.com/photo-1677442d019cecf8671c1b34fac557003?w=500&h=300&fit=crop",
    category: "Technology",
    date: "Today",
    source: "Tech Times",
  },
  {
    id: "2",
    title: "Stock Markets Rally on Economic News",
    description:
      "Global markets show strong performance following positive economic indicators from leading economies.",
    image: "https://images.unsplash.com/photo-1642202604948-a7c87d65d7f7?w=500&h=300&fit=crop",
    category: "Business",
    date: "Today",
    source: "Financial Daily",
  },
  {
    id: "3",
    title: "Climate Summit Reaches Historic Agreement",
    description:
      "World leaders agree on comprehensive climate action plan aimed at meeting global environmental targets.",
    image: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=500&h=300&fit=crop",
    category: "Environment",
    date: "Yesterday",
    source: "Global News",
  },
  {
    id: "4",
    title: "Sports: Championship Team Advances to Finals",
    description:
      "In an exciting match, the defending champions secure their spot in the championship finals with a thrilling victory.",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&h=300&fit=crop",
    category: "Sports",
    date: "Yesterday",
    source: "Sports World",
  },
  {
    id: "5",
    title: "Health: New Treatment Offers Hope",
    description: "Medical researchers unveil promising results from clinical trials of innovative treatment approach.",
    image: "https://images.unsplash.com/photo-1576091160550-112173f7f869?w=500&h=300&fit=crop",
    category: "Health",
    date: "2 days ago",
    source: "Health News",
  },
  {
    id: "6",
    title: "Entertainment: New Film Breaks Box Office Records",
    description: "Latest blockbuster smashes opening weekend records, becoming fastest film to reach milestone.",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&h=300&fit=crop",
    category: "Entertainment",
    date: "2 days ago",
    source: "Entertainment Plus",
  },
]

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setNews(MOCK_NEWS)
      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">Stay Informed</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Get the latest news, trending stories, and in-depth analysis from around the world, all in one place.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <input
          type="search"
          placeholder="Search news..."
          className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Featured Article */}
      {news.length > 0 && (
        <div className="mb-12 rounded-lg border border-border overflow-hidden bg-card hover:shadow-lg transition-shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="relative h-64 md:h-full bg-muted">
              <img
                src={news[0].image || "/placeholder.svg"}
                alt={news[0].title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3C/svg%3E'
                }}
              />
            </div>
            <div className="flex flex-col justify-between p-6">
              <div>
                <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent mb-3">
                  {news[0].category}
                </span>
                <h2 className="text-3xl font-bold mb-3">{news[0].title}</h2>
                <p className="text-muted-foreground mb-4">{news[0].description}</p>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{news[0].source}</span>
                <span>{news[0].date}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* News Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Latest News</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-lg border border-border bg-card animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-6 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.slice(1).map((article) => (
              <NewsCard key={article.id} {...article} />
            ))}
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Browse Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {["Technology", "Business", "Health", "Sports", "Entertainment", "World"].map((cat) => (
            <button
              key={cat}
              className="rounded-lg border border-border bg-card p-4 text-center font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

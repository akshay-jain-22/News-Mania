"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { NewsHeader } from "@/components/news-header"
import { fetchNews } from "@/lib/news-api"
import { formatDistanceToNow } from "@/lib/utils"
import type { NewsArticle } from "@/types/news"
import {
  Briefcase,
  Monitor,
  Heart,
  Trophy,
  Atom,
  Film,
  Globe,
  Loader2,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const categories = [
  {
    id: "business",
    name: "Business",
    description: "Markets, finance, and corporate news",
    icon: Briefcase,
    color: "bg-blue-500",
  },
  {
    id: "technology",
    name: "Technology",
    description: "Tech innovations, gadgets, and digital trends",
    icon: Monitor,
    color: "bg-purple-500",
  },
  {
    id: "health",
    name: "Health",
    description: "Medical breakthroughs and wellness news",
    icon: Heart,
    color: "bg-red-500",
  },
  {
    id: "sports",
    name: "Sports",
    description: "Latest scores, games, and athletic achievements",
    icon: Trophy,
    color: "bg-yellow-500",
  },
  {
    id: "science",
    name: "Science",
    description: "Research discoveries and scientific advances",
    icon: Atom,
    color: "bg-green-500",
  },
  {
    id: "entertainment",
    name: "Entertainment",
    description: "Movies, music, celebrities, and pop culture",
    icon: Film,
    color: "bg-pink-500",
  },
]

export default function TopicsPage() {
  const [categoryPreviews, setCategoryPreviews] = useState<Record<string, NewsArticle[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCategoryPreviews = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log("Loading category previews...")

        const previewPromises = categories.map(async (category) => {
          try {
            const articles = await fetchNews({
              category: category.id,
              pageSize: 3,
              country: "us",
            })
            return { categoryId: category.id, articles }
          } catch (error) {
            console.error(`Failed to load ${category.id} articles:`, error)
            return { categoryId: category.id, articles: [] }
          }
        })

        const results = await Promise.all(previewPromises)

        const previews: Record<string, NewsArticle[]> = {}
        results.forEach(({ categoryId, articles }) => {
          previews[categoryId] = articles
        })

        setCategoryPreviews(previews)
        console.log("Category previews loaded successfully")
      } catch (error) {
        console.error("Failed to load category previews:", error)
        setError("Unable to load topic previews. Please check your connection and try again.")
      } finally {
        setLoading(false)
      }
    }

    loadCategoryPreviews()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <NewsHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-xl">Loading news topics...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <NewsHeader />

      <main className="container mx-auto px-4 py-8">
        {error && (
          <Alert className="mb-6 bg-red-900/20 border-red-600">
            <AlertDescription className="text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">News Topics</h1>
          <p className="text-gray-400 text-lg">Explore news by category and discover stories that matter to you</p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => {
            const Icon = category.icon
            const articles = categoryPreviews[category.id] || []

            return (
              <Card key={category.id} className="bg-[#1a1a1a] border-gray-800 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${category.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-white">{category.name}</CardTitle>
                      <p className="text-sm text-gray-400">{category.description}</p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Article Previews */}
                  {articles.length > 0 ? (
                    <div className="space-y-3">
                      {articles.slice(0, 3).map((article, index) => (
                        <div key={article.id} className="border-l-2 border-gray-700 pl-3">
                          <Link
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block hover:text-primary transition-colors"
                          >
                            <h4 className="text-sm font-medium line-clamp-2 mb-1">{article.title}</h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Badge variant="outline" className="text-xs">
                                {article.source.name}
                              </Badge>
                              <Clock className="h-3 w-3" />
                              <span>{formatDistanceToNow(new Date(article.publishedAt))} ago</span>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Globe className="h-8 w-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No articles available</p>
                    </div>
                  )}

                  {/* View All Button */}
                  <div className="pt-4 border-t border-gray-800">
                    <Button
                      asChild
                      className="w-full bg-transparent border border-gray-700 hover:bg-gray-800 text-white"
                    >
                      <Link href={`/topics/${category.id}`}>
                        <TrendingUp className="h-4 w-4 mr-2" />
                        View All {category.name} News
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Popular Topics Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Trending Topics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              "AI & Machine Learning",
              "Climate Change",
              "Cryptocurrency",
              "Space Exploration",
              "Healthcare Innovation",
              "Renewable Energy",
              "Cybersecurity",
              "Electric Vehicles",
              "Social Media",
              "Gaming Industry",
              "Biotechnology",
              "Remote Work",
            ].map((topic) => (
              <Button
                key={topic}
                variant="outline"
                className="bg-transparent border-gray-700 hover:bg-gray-800 text-white text-sm h-auto py-3 px-4"
                asChild
              >
                <Link href={`/search?q=${encodeURIComponent(topic)}`}>{topic}</Link>
              </Button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

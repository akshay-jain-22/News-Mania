"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { NewsGrid } from "@/components/news-grid"
import { fetchNews } from "@/lib/news-api"
import type { NewsArticle } from "@/types/news"
import { Loader2 } from "lucide-react"

const categories = [
  { name: "Technology", slug: "technology" },
  { name: "Business", slug: "business" },
  { name: "Health", slug: "health" },
  { name: "Science", slug: "science" },
  { name: "Sports", slug: "sports" },
  { name: "Entertainment", slug: "entertainment" },
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
              category: category.slug,
              pageSize: 3,
              country: "us",
            })
            return { categoryId: category.slug, articles }
          } catch (error) {
            console.error(`Failed to load ${category.slug} articles:`, error)
            return { categoryId: category.slug, articles: [] }
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
      <div className="min-h-screen bg-background text-foreground">
        <Header />
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
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container py-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-4">Browse Topics</h1>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category.slug}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>

          {categories.map((category) => {
            const articles = categoryPreviews[category.slug] || []

            return (
              <div key={category.slug} className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">{category.name} News</h2>
                <NewsGrid articles={articles} title={category.name} />
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

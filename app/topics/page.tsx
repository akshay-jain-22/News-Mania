"use client"

import { useState } from "react"
import type { NewsArticle } from "@/types/news"
import { NewsCard } from "@/components/news-card"
import { fetchNews } from "@/lib/news-api"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "technology", label: "Technology" },
  { id: "business", label: "Business" },
  { id: "health", label: "Health" },
  { id: "science", label: "Science" },
  { id: "sports", label: "Sports" },
  { id: "environment", label: "Environment" },
]

export default function TopicsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")

  useEffect(() => {
    async function loadNews() {
      setLoading(true)
      try {
        const category = selectedCategory === "all" ? undefined : selectedCategory
        const news = await fetchNews(category)
        setArticles(news)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadNews()
  }, [selectedCategory])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Browse by Topic</h1>
        <p className="mt-2 text-muted-foreground">Explore news from your favorite categories</p>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? "default" : "outline"}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}

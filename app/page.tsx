"use client"

import { useEffect, useState } from "react"
import type { NewsArticle } from "@/types/news"
import { NewsCard } from "@/components/news-card"
import { fetchNews } from "@/lib/news-api"

export default function HomePage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadNews() {
      try {
        const news = await fetchNews()
        setArticles(news)
      } catch (err) {
        setError("Failed to load news")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadNews()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg bg-destructive/10 p-4 text-destructive">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Latest News</h1>
        <p className="mt-2 text-muted-foreground">Stay updated with the latest stories from around the world</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  )
}

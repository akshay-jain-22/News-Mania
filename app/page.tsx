"use client"

import { useEffect, useState } from "react"
import { fetchNews } from "@/lib/news-api"
import type { NewsArticle } from "@/types/news"
import { NewsCard } from "@/components/news-card"

export default function Home() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNews = async () => {
      try {
        const data = await fetchNews()
        setArticles(data)
      } catch (error) {
        console.error("Error loading news:", error)
      } finally {
        setLoading(false)
      }
    }

    loadNews()
  }, [])

  if (loading) {
    return <div className="text-center py-8">Loading news...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Latest News</h1>
        <p className="text-muted-foreground mt-2">Stay informed with the latest headlines</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  )
}

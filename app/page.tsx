"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { NewsCard } from "@/components/news-card"
import { fetchNews } from "@/lib/news-api"
import type { NewsArticle } from "@/types/news"

export default function HomePage() {
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Latest News</h1>
        {loading ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Loading articles...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

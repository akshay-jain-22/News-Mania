"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { NewsCard } from "@/components/news-card"
import { fetchNews } from "@/lib/news-api"
import type { NewsArticle } from "@/types/news"

const CATEGORIES = ["technology", "business", "environment", "health", "science"]

export default function TopicsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(false)

  const handleCategorySelect = async (category: string) => {
    setSelectedCategory(category)
    setLoading(true)
    try {
      const data = await fetchNews(category)
      setArticles(data)
    } catch (error) {
      console.error("Error loading articles:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Topics</h1>

        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => handleCategorySelect(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Loading articles...</p>
          </div>
        ) : selectedCategory ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.length > 0 ? (
              articles.map((article) => <NewsCard key={article.id} article={article} />)
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-lg text-muted-foreground">No articles found in this category.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">Select a topic to view articles.</p>
          </div>
        )}
      </main>
    </div>
  )
}

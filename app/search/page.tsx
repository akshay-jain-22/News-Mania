"use client"

import type React from "react"

import { useState } from "react"
import type { NewsArticle } from "@/types/news"
import { NewsCard } from "@/components/news-card"
import { searchNews } from "@/lib/news-api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSearched(true)
    try {
      const results = await searchNews(query)
      setArticles(results)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Search News</h1>
        <p className="mt-2 text-muted-foreground">Find articles about topics you care about</p>
      </div>

      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <Input
          placeholder="Search articles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          <Search className="h-4 w-4" />
          <span className="ml-2">Search</span>
        </Button>
      </form>

      {searched && (
        <div>
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-96 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : articles.length > 0 ? (
            <div>
              <p className="mb-6 text-sm text-muted-foreground">Found {articles.length} results</p>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg bg-muted p-8 text-center">
              <p className="text-muted-foreground">No articles found for "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { NewsCard } from "@/components/news-card"
import { fetchNews } from "@/lib/news-api"
import type { NewsArticle } from "@/types/news"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<NewsArticle[]>([])
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearched(true)

    if (!query.trim()) {
      setResults([])
      return
    }

    const articles = await fetchNews()
    const filtered = articles.filter(
      (article) =>
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.description.toLowerCase().includes(query.toLowerCase()),
    )
    setResults(filtered)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Search News</h1>
        <p className="text-muted-foreground mt-2">Find articles by keyword</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search articles..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">Search</Button>
      </form>

      {searched && (
        <div>
          <p className="text-sm text-muted-foreground">
            Found {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {results.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
              {results.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground mt-4">No articles found matching your search.</p>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { NewsHeader } from "@/components/news-header"
import { NewsCard } from "@/components/news-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sparkles } from "lucide-react"
import type { NewsArticle } from "@/types/news"

export default function PersonalizedPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Fetch personalized recommendations
  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/personalized-feed?pageSize=30&page=1")
        const data = await response.json()

        if (data.articles && Array.isArray(data.articles)) {
          setArticles(data.articles)
          setPage(2)
          setHasMore(data.articles.length >= 30)
        }
      } catch (error) {
        console.error("Error loading personalized feed:", error)
      } finally {
        setLoading(false)
      }
    }

    loadRecommendations()
  }, [])

  const loadMoreArticles = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const response = await fetch(`/api/personalized-feed?pageSize=30&page=${page}`)
      const data = await response.json()

      if (data.articles && Array.isArray(data.articles)) {
        if (data.articles.length > 0) {
          setArticles((prev) => [...prev, ...data.articles])
          setPage((prev) => prev + 1)
        } else {
          setHasMore(false)
        }
      }
    } catch (error) {
      console.error("Error loading more articles:", error)
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NewsHeader />

      <main className="flex-1 py-6">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6">
            {/* Header Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">Personalized For You</h1>
              </div>
              <p className="text-muted-foreground">Articles curated based on your reading history and preferences</p>
            </div>

            {/* Info Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  How Personalization Works
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>
                  Our recommendation engine analyzes your reading history and preferences to suggest articles you'll
                  find most relevant. The more you read, the better our recommendations become.
                </p>
              </CardContent>
            </Card>

            {/* Articles Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="ml-2 text-xl">Loading personalized articles...</span>
              </div>
            ) : articles.length > 0 ? (
              <>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {articles.map((article, index) => (
                    <NewsCard key={`personalized-${index}`} article={article} />
                  ))}
                </div>

                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <Button
                      variant="outline"
                      onClick={loadMoreArticles}
                      disabled={loadingMore}
                      className="px-8 bg-transparent"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading More...
                        </>
                      ) : (
                        "Load More Articles"
                      )}
                    </Button>
                  </div>
                )}

                {!hasMore && articles.length > 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <p>You've seen all personalized recommendations for now</p>
                  </div>
                )}
              </>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    No personalized recommendations yet. Start reading articles to get personalized suggestions!
                  </p>
                  <Button asChild>
                    <a href="/topics">Browse Topics</a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

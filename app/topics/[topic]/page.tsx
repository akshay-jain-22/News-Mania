"use client"

import { useState, useEffect } from "react"
import { NewsHeader } from "@/components/news-header"
import { NewsCard } from "@/components/news-card"
import { fetchNews } from "@/lib/news-api"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import type { NewsArticle } from "@/types/news"

export default function TopicPage({ params }: { params: { topic: string } }) {
  const { topic } = params
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Format topic name for display (capitalize first letter)
  const topicName = topic.charAt(0).toUpperCase() + topic.slice(1)

  // Fetch news for the selected topic
  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true)
        const fetchedArticles = await fetchNews({ category: topic, pageSize: 30 })
        setArticles(fetchedArticles)
        setPage(2)
      } catch (error) {
        console.error("Error loading articles:", error)
      } finally {
        setLoading(false)
      }
    }

    loadArticles()
  }, [topic])

  const loadMoreArticles = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const moreArticles = await fetchNews({ category: topic, pageSize: 30, page })

      if (moreArticles.length > 0) {
        setArticles((prev) => [...prev, ...moreArticles])
        setPage((prev) => prev + 1)
      } else {
        setHasMore(false)
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
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/topics">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Topics
                </Link>
              </Button>
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">{topicName} News</h1>
              <p className="text-muted-foreground">Latest news and updates about {topicName.toLowerCase()}</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="ml-2 text-xl">Loading articles...</span>
              </div>
            ) : (
              <>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {articles.map((article, index) => (
                    <NewsCard key={`${topic}-${index}`} article={article} />
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
                    <p>You've reached the end of articles for {topicName}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { NewsCard } from "@/components/news-card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { fetchNews } from "@/lib/news-api"
import type { NewsArticle } from "@/types/news"
import { useToast } from "@/components/ui/use-toast"

export default function DashboardPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { toast } = useToast()

  const loadNews = async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      console.log(`Loading news page ${pageNum}...`)
      const newArticles = await fetchNews({
        pageSize: 20,
        page: pageNum,
        forceRefresh: isRefresh,
      })

      console.log(`Loaded ${newArticles.length} articles`)

      if (pageNum === 1) {
        setArticles(newArticles)
      } else {
        setArticles((prev) => [...prev, ...newArticles])
      }

      // Check if we have more articles
      setHasMore(newArticles.length === 20)
      setPage(pageNum)

      if (isRefresh) {
        toast({
          title: "News refreshed",
          description: `Loaded ${newArticles.length} fresh articles`,
        })
      }
    } catch (error) {
      console.error("Error loading news:", error)
      setError("Failed to load news. Please check your internet connection and try again.")

      toast({
        variant: "destructive",
        title: "Error loading news",
        description: "Please check your connection and try again.",
      })
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = async () => {
    if (!loadingMore && hasMore) {
      await loadNews(page + 1)
    }
  }

  const handleRefresh = async () => {
    await loadNews(1, true)
  }

  useEffect(() => {
    loadNews()
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />

      <main className="flex-1 py-6">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Live News Feed</h1>
                <p className="text-muted-foreground">Real-time news from around the world</p>
              </div>
              <Button onClick={handleRefresh} disabled={loading} variant="outline">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
            </div>

            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading latest news...</p>
                </div>
              </div>
            )}

            {/* Masonry Grid */}
            {!loading && articles.length > 0 && (
              <div className="masonry-grid">
                {articles.map((article) => (
                  <div key={article.id} className="masonry-item">
                    <NewsCard article={article} />
                  </div>
                ))}
              </div>
            )}

            {/* No Articles State */}
            {!loading && articles.length === 0 && !error && (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No news articles available</p>
                <Button onClick={() => loadNews(1, true)}>Try Again</Button>
              </div>
            )}

            {/* Load More Button */}
            {!loading && articles.length > 0 && hasMore && (
              <div className="flex justify-center py-6">
                <Button onClick={handleLoadMore} disabled={loadingMore} variant="outline">
                  {loadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    "Load More Articles"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .masonry-grid {
          column-count: 1;
          column-gap: 1.5rem;
          margin: 0;
        }

        @media (min-width: 640px) {
          .masonry-grid {
            column-count: 2;
          }
        }

        @media (min-width: 1024px) {
          .masonry-grid {
            column-count: 3;
          }
        }

        @media (min-width: 1280px) {
          .masonry-grid {
            column-count: 4;
          }
        }

        .masonry-item {
          break-inside: avoid;
          margin-bottom: 1.5rem;
          display: inline-block;
          width: 100%;
        }
      `}</style>
    </div>
  )
}

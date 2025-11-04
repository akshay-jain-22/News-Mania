"use client"

import { useState, useEffect } from "react"
import { NewsHeader } from "@/components/news-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Sparkles, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth"

interface PersonalizedItem {
  articleId: string
  title: string
  score: number
  reason: string
  category: string
  thumb: string
  source: string
  publishAt: string
  credibility: number
}

interface PersonalizeResponse {
  items: PersonalizedItem[]
  source: "personalized" | "fallback"
  fallbackBuckets?: string[]
  totalCount: number
}

function getOrCreateAnonUserId(): string {
  if (typeof window === "undefined") return ""
  const key = "anon-user-id"
  let anonId = localStorage.getItem(key)
  if (!anonId) {
    anonId = `anon-${Date.now()}-${Math.random().toString(36).substring(7)}`
    localStorage.setItem(key, anonId)
  }
  return anonId
}

export default function PersonalizedPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<PersonalizedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [source, setSource] = useState<"personalized" | "fallback" | null>(null)
  const [fallbackBuckets, setFallbackBuckets] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPersonalizedFeed = async () => {
      try {
        setLoading(true)
        setError(null)

        const userId = user?.id || getOrCreateAnonUserId()
        console.log(`[v0] Loading personalized feed for userId=${userId}`)

        const response = await fetch("/api/ml/personalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            limit: 20,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch personalized feed: ${response.statusText}`)
        }

        const data: PersonalizeResponse = await response.json()

        setItems(data.items)
        setSource(data.source)
        setFallbackBuckets(data.fallbackBuckets || [])
        setPage(2)
        setHasMore(data.totalCount > 20)

        console.log(`[v0] Loaded ${data.items.length} items, source=${data.source}`)
      } catch (err) {
        console.error("[v0] Error loading personalized feed:", err)
        setError(err instanceof Error ? err.message : "Failed to load personalized feed")
      } finally {
        setLoading(false)
      }
    }

    loadPersonalizedFeed()
  }, [user])

  const loadMoreItems = async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)

      const userId = user?.id || getOrCreateAnonUserId()
      const response = await fetch("/api/ml/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          limit: 20,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to load more items")
      }

      const data: PersonalizeResponse = await response.json()

      if (data.items.length > 0) {
        setItems((prev) => [...prev, ...data.items])
        setPage((prev) => prev + 1)
      } else {
        setHasMore(false)
      }
    } catch (err) {
      console.error("[v0] Error loading more items:", err)
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
            {source && (
              <div
                className={`rounded-lg border p-4 ${
                  source === "personalized" ? "bg-primary/5 border-primary/20" : "bg-yellow-500/5 border-yellow-500/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  {source === "personalized" ? (
                    <>
                      <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <h2 className="font-semibold text-primary">For you — Personalized</h2>
                        <p className="text-sm text-muted-foreground">
                          Articles curated based on your reading history and preferences
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h2 className="font-semibold">Top picks for you (default feed)</h2>
                        <p className="text-sm text-muted-foreground">
                          Personalized feed is loading or not available — here's top news and trending topics
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Header Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold tracking-tight">
                  {source === "personalized" ? "Your Personalized Feed" : "Recommended for You"}
                </h1>
              </div>
            </div>

            {/* Articles Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="ml-2 text-xl">Loading articles...</span>
              </div>
            ) : items.length > 0 ? (
              <>
                {source === "fallback" && (
                  <div className="space-y-8">
                    {/* Top News Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Top News</h3>
                      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {items
                          .filter((item) => !["business", "tech", "technology", "sports"].includes(item.category))
                          .slice(0, 3)
                          .map((item, idx) => (
                            <PersonalizedItemCard key={`top-${idx}`} item={item} />
                          ))}
                      </div>
                    </div>

                    {/* Business Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Business</h3>
                      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {items
                          .filter((item) => item.category === "business")
                          .slice(0, 4)
                          .map((item, idx) => (
                            <PersonalizedItemCard key={`business-${idx}`} item={item} />
                          ))}
                      </div>
                    </div>

                    {/* Tech Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Technology</h3>
                      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {items
                          .filter((item) => ["tech", "technology"].includes(item.category))
                          .slice(0, 4)
                          .map((item, idx) => (
                            <PersonalizedItemCard key={`tech-${idx}`} item={item} />
                          ))}
                      </div>
                    </div>

                    {/* Sports Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Sports</h3>
                      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {items
                          .filter((item) => item.category === "sports")
                          .slice(0, 4)
                          .map((item, idx) => (
                            <PersonalizedItemCard key={`sports-${idx}`} item={item} />
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Personalized grid (single flow) */}
                {source === "personalized" && (
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {items.map((item, idx) => (
                      <PersonalizedItemCard key={`personalized-${idx}`} item={item} />
                    ))}
                  </div>
                )}

                {hasMore && (
                  <div className="flex justify-center mt-8">
                    <Button
                      variant="outline"
                      onClick={loadMoreItems}
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

                {!hasMore && items.length > 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <p>You've reached the end of the feed</p>
                  </div>
                )}
              </>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground mb-4">No articles available at the moment. Check back soon!</p>
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

function PersonalizedItemCard({ item }: { item: PersonalizedItem }) {
  return (
    <Card className="bg-[#1a1a1a] border-gray-800 overflow-hidden group hover:border-gray-700 transition-all hover:shadow-lg">
      <div className="p-4 flex flex-col h-full">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">{item.category}</span>
            <span className="text-xs text-muted-foreground">{item.credibility}% credible</span>
          </div>
          <h3 className="font-bold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <p className="text-xs text-muted-foreground">{item.reason}</p>
        </div>
        <div className="mt-auto pt-3 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{item.source}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

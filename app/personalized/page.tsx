"use client"

import { useState, useEffect } from "react"
import { NewsHeader } from "@/components/news-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Sparkles, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth"
import { NewsCard } from "@/components/news-card"
import type { NewsArticle } from "@/types/news"
import { useI18n } from "@/lib/i18n"
import { translateText } from "@/lib/translateText"

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
  description?: string
  content?: string
  url?: string
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
  const { t, locale } = useI18n()
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

        if (locale !== "en") {
          const translatedItems = await Promise.all(
            data.items.map(async (item) => ({
              ...item,
              title: await translateText(item.title, locale, "news headline"),
              description: item.description
                ? await translateText(item.description, locale, "news description")
                : item.description,
              reason: await translateText(item.reason, locale, "recommendation reason"),
            })),
          )
          setItems(translatedItems)
        } else {
          setItems(data.items)
        }

        setSource(data.source)
        setFallbackBuckets(data.fallbackBuckets || [])
        setPage(2)
        setHasMore(data.totalCount > 20)

        console.log(`[v0] Loaded ${data.items.length} items, source=${data.source}`)
      } catch (err) {
        console.error("[v0] Error loading personalized feed:", err)
        setError(err instanceof Error ? err.message : t("common.error"))
      } finally {
        setLoading(false)
      }
    }

    loadPersonalizedFeed()
  }, [user, locale, t])

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

  const convertToNewsArticle = (item: PersonalizedItem): NewsArticle => {
    return {
      id: item.articleId,
      title: item.title,
      description: item.description || item.reason,
      content: item.content || "",
      urlToImage: item.thumb,
      url: item.url || "#",
      source: {
        id: item.source.toLowerCase().replace(/\s+/g, "-"),
        name: item.source,
      },
      author: "",
      publishedAt: item.publishAt,
      isFactChecked: false,
      credibilityScore: item.credibility,
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NewsHeader />

      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="space-y-6">
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
                <h1 className="text-3xl font-bold tracking-tight">{t("personalized.title")}</h1>
              </div>
              <p className="text-muted-foreground">{t("personalized.basedOnInterests")}</p>
            </div>

            {/* Articles Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="ml-2 text-xl">{t("common.loading")}</span>
              </div>
            ) : items.length > 0 ? (
              <>
                {/* Single continuous grid for personalized feed */}
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <NewsCard key={`personalized-${item.articleId}`} article={convertToNewsArticle(item)} />
                  ))}
                </div>

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
                          {t("common.loading")}
                        </>
                      ) : (
                        t("common.viewMore")
                      )}
                    </Button>
                  </div>
                )}

                {!hasMore && items.length > 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <p>{t("personalized.endOfFeed") || "You've reached the end of the feed"}</p>
                  </div>
                )}
              </>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {t("personalized.noArticles") || "No articles available at the moment. Check back soon!"}
                  </p>
                  <Button asChild>
                    <a href="/topics">{t("topics.browseByTopic")}</a>
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

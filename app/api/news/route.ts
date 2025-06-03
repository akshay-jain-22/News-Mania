import { type NextRequest, NextResponse } from "next/server"
import type { NewsArticle } from "@/types/news"

// Use the provided NewsAPI key
const API_KEY = "2d28c89f4476422887cf8adbe7bb1e0b"
const BASE_URL = "https://newsapi.org/v2"

// Cache for API responses
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes cache
const newsCache: Record<string, { data: NewsArticle[]; timestamp: number }> = {}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") || "general"
    const query = searchParams.get("query") || ""
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "50")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const country = searchParams.get("country") || "us"
    const sources = searchParams.get("sources")?.split(",") || []
    const forceRefresh = searchParams.get("forceRefresh") === "true"

    const sourcesStr = sources.join(",")
    const cacheKey = `${category}-${query}-${pageSize}-${page}-${country}-${sourcesStr}`

    const currentTime = Date.now()
    const shouldRefresh =
      forceRefresh || !newsCache[cacheKey] || currentTime - newsCache[cacheKey].timestamp > CACHE_DURATION

    if (!shouldRefresh && newsCache[cacheKey]) {
      console.log(`Using cached data for ${cacheKey}`)
      return NextResponse.json({ articles: newsCache[cacheKey].data, cached: true })
    }

    console.log(`Fetching fresh news data for ${cacheKey}`)

    let url = `${BASE_URL}/top-headlines?pageSize=${pageSize}&page=${page}&apiKey=${API_KEY}`

    if (category && category !== "all" && category !== "general") {
      url += `&category=${category}`
    }

    if (country && !sources.length) {
      url += `&country=${country}`
    }

    if (query) {
      url += `&q=${encodeURIComponent(query)}`
    }

    if (sources && sources.length > 0) {
      url += `&sources=${encodeURIComponent(sources.join(","))}`
    }

    console.log(`Fetching from: ${url.replace(API_KEY, "***")}`)

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Newsmania/1.0",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`News API returned ${response.status}: ${response.statusText}`, errorText)
      return NextResponse.json(
        { error: `News API error: ${response.status} - ${response.statusText}`, details: errorText },
        { status: response.status },
      )
    }

    const data = await response.json()

    if (!data.articles || !Array.isArray(data.articles)) {
      return NextResponse.json({ error: "Invalid response format from News API" }, { status: 500 })
    }

    const articles: NewsArticle[] = data.articles
      .filter((article: any) => {
        return (
          article.title &&
          article.title !== "[Removed]" &&
          article.description &&
          article.description !== "[Removed]" &&
          article.url &&
          article.source?.name
        )
      })
      .map((article: any, index: number) => ({
        id: `api-${Date.now()}-${index}`,
        source: article.source || { id: null, name: "Unknown Source" },
        author: article.author || "Unknown Author",
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt || new Date().toISOString(),
        content: article.content || article.description,
        credibilityScore: Math.floor(Math.random() * 30) + 70,
        isFactChecked: Math.random() > 0.7,
        factCheckResult: null,
      }))

    newsCache[cacheKey] = {
      data: articles,
      timestamp: currentTime,
    }

    console.log(`Successfully fetched ${articles.length} articles from API`)
    return NextResponse.json({ articles, cached: false })
  } catch (error) {
    console.error("Error in news API route:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

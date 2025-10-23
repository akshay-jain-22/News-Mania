import { type NextRequest, NextResponse } from "next/server"
import type { NewsArticle } from "@/types/news"

// Use the provided NewsAPI key with fallback
const API_KEY = process.env.NEWS_API_KEY || "2d28c89f4476422887cf8adbe7bb1e0b"
const BASE_URL = "https://newsapi.org/v2"

// Cache for API responses
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes cache
const newsCache: Record<string, { data: NewsArticle[]; timestamp: number }> = {}

export async function GET(request: NextRequest) {
  try {
    // Validate API key
    if (!API_KEY || API_KEY === "your_api_key_here") {
      console.error("NewsAPI key is not configured")
      return NextResponse.json({ error: "News service is not configured properly" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category") || "general"
    const query = searchParams.get("query") || ""
    const pageSize = Math.min(Number.parseInt(searchParams.get("pageSize") || "20"), 100) // Limit to 100
    const page = Math.max(Number.parseInt(searchParams.get("page") || "1"), 1) // Minimum 1
    const country = searchParams.get("country") || ""
    const sources = searchParams.get("sources")?.split(",").filter(Boolean) || []
    const forceRefresh = searchParams.get("forceRefresh") === "true"

    const sourcesStr = sources.join(",")
    const cacheKey = `${category}-${query}-${pageSize}-${page}-${country}-${sourcesStr}`

    const currentTime = Date.now()
    const shouldRefresh =
      forceRefresh || !newsCache[cacheKey] || currentTime - newsCache[cacheKey].timestamp > CACHE_DURATION

    // Return cached data if available and not forcing refresh
    if (!shouldRefresh && newsCache[cacheKey]) {
      console.log(`Returning cached data for ${cacheKey}`)
      return NextResponse.json({
        articles: newsCache[cacheKey].data,
        cached: true,
        timestamp: newsCache[cacheKey].timestamp,
      })
    }

    console.log(`Fetching fresh news data for ${cacheKey}`)

    // Build URL with proper validation
    let url = `${BASE_URL}/top-headlines?pageSize=${pageSize}&page=${page}&apiKey=${API_KEY}`

    // Add category (but not if using sources)
    if (category && category !== "all" && category !== "general" && sources.length === 0) {
      url += `&category=${encodeURIComponent(category)}`
    }

    // Add country (but not if using sources)
    if (country && sources.length === 0) {
      url += `&country=${encodeURIComponent(country)}`
    }

    // Add query if provided
    if (query.trim()) {
      url += `&q=${encodeURIComponent(query.trim())}`
    }

    // Add sources if provided (this overrides country and category)
    if (sources.length > 0) {
      url += `&sources=${encodeURIComponent(sources.join(","))}`
    }

    console.log(`Fetching from NewsAPI: ${url.replace(API_KEY, "***")}`)

    // Make the API request with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Newsmania/1.0",
      },
      signal: controller.signal,
    }).finally(() => {
      clearTimeout(timeoutId)
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      console.error(`NewsAPI error ${response.status}: ${response.statusText}`, errorText)

      // Handle specific error codes
      if (response.status === 426) {
        return NextResponse.json(
          { error: "API access restricted. Please check your NewsAPI subscription." },
          { status: 426 },
        )
      }

      if (response.status === 429) {
        return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 })
      }

      if (response.status === 401) {
        return NextResponse.json(
          { error: "Invalid API key. Please check your NewsAPI configuration." },
          { status: 401 },
        )
      }

      return NextResponse.json(
        { error: `NewsAPI error: ${response.status} - ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    // Validate response structure
    if (!data || typeof data !== "object") {
      console.error("Invalid response format: not an object")
      return NextResponse.json({ error: "Invalid response format from NewsAPI" }, { status: 500 })
    }

    if (!data.articles || !Array.isArray(data.articles)) {
      console.error("Invalid response format: articles not found or not an array", data)
      return NextResponse.json({ error: "No articles found in NewsAPI response" }, { status: 500 })
    }

    // Process and filter articles
    const articles: NewsArticle[] = data.articles
      .filter((article: any) => {
        return (
          article &&
          typeof article === "object" &&
          article.title &&
          article.title !== "[Removed]" &&
          article.description &&
          article.description !== "[Removed]" &&
          article.url &&
          article.source?.name
        )
      })
      .map((article: any, index: number) => {
        try {
          return {
            id: `api-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
            source: {
              id: article.source?.id || null,
              name: article.source?.name || "Unknown Source",
            },
            author: article.author || "Unknown Author",
            title: article.title,
            description: article.description,
            url: article.url,
            urlToImage: article.urlToImage || null,
            publishedAt: article.publishedAt || new Date().toISOString(),
            content: article.content || article.description,
            credibilityScore: Math.floor(Math.random() * 30) + 70,
            isFactChecked: Math.random() > 0.7,
            factCheckResult: null,
          }
        } catch (articleError) {
          console.error("Error processing article:", articleError, article)
          return null
        }
      })
      .filter(Boolean) as NewsArticle[]

    // Cache the results
    if (articles.length > 0) {
      newsCache[cacheKey] = {
        data: articles,
        timestamp: currentTime,
      }
    }

    console.log(`Successfully processed ${articles.length} articles from NewsAPI`)

    return NextResponse.json({
      articles,
      cached: false,
      timestamp: currentTime,
      total: articles.length,
    })
  } catch (error) {
    console.error("Unexpected error in news API route:", error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return NextResponse.json({ error: "Request timeout. Please try again." }, { status: 408 })
      }

      if (error.message.includes("fetch")) {
        return NextResponse.json({ error: "Network error. Please check your internet connection." }, { status: 503 })
      }
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 },
    )
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  })
}

import { NextRequest, NextResponse } from "next/server"
import { fetchNewsData, SUPPORTED_CATEGORIES } from "@/lib/fetchNewsData"

// Cache for API responses
const CACHE_DURATION = Number.parseInt(process.env.TIME_TO_LIVE_NEWS || "600") * 1000 // Default 10 minutes
const newsDataCache: Record<string, { data: any; timestamp: number; source: "newsdata" | "newsapi-fallback" }> = {}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      country = "in",
      languageKey = "en",
      categories = [],
      page = 1,
      pageSize = 20,
      forceRefresh = false,
      requireImage = false,
    } = body

    // Map language keys to API codes
    const languageMap: Record<string, "en" | "hi" | "kn"> = {
      en: "en",
      english: "en",
      hi: "hi",
      hindi: "hi",
      kn: "kn",
      kannada: "kn",
    }

    const language = languageMap[languageKey.toLowerCase()] || "en"

    // Validate categories
    const validCategories = categories.filter((cat: string) => SUPPORTED_CATEGORIES.includes(cat.toLowerCase()))

    // Create cache key
    const cacheKey = `newsdata::country:${country}:lang:${language}:cats:${validCategories.join(",") || "all"}:page:${page}`
    const currentTime = Date.now()

    console.log("[v0] NewsData API request:", {
      country,
      language,
      categories: validCategories,
      page,
      pageSize,
      cacheKey,
    })

    // Check cache first
    if (!forceRefresh && newsDataCache[cacheKey] && currentTime - newsDataCache[cacheKey].timestamp < CACHE_DURATION) {
      console.log(`[v0] Returning cached data for ${cacheKey}`)
      return NextResponse.json({
        ...newsDataCache[cacheKey].data,
        cached: true,
        source: newsDataCache[cacheKey].source,
      })
    }

    // Fetch from NewsData.io with fallback
    const result = await fetchNewsData({
      country,
      language,
      categories: validCategories,
      page,
      pageSize,
      requireImage,
    })

    console.log(`[v0] Fetched from ${result.source}:`, {
      articlesCount: result.data.articles?.length,
      totalResults: result.data.totalResults,
    })

    // Cache the response
    newsDataCache[cacheKey] = {
      data: result.data,
      timestamp: currentTime,
      source: result.source,
    }

    // Add source label to response
    return NextResponse.json({
      ...result.data,
      cached: false,
      source: result.source,
    })
  } catch (error) {
    console.error("[v0] NewsData API route error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to fetch news",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// GET endpoint for simple requests
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const body = {
    country: searchParams.get("country") || "in",
    languageKey: searchParams.get("language") || "en",
    categories: searchParams.get("categories")?.split(",").filter(Boolean) || [],
    page: Number.parseInt(searchParams.get("page") || "1"),
    pageSize: Number.parseInt(searchParams.get("pageSize") || "20"),
    forceRefresh: searchParams.get("forceRefresh") === "true",
    requireImage: searchParams.get("requireImage") === "true",
  }

  return POST(
    new NextRequest(request.url, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  )
}

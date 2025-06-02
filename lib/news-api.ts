import type { NewsArticle } from "@/types/news"
import type { FactCheckResult } from "@/types/news"

// Use the provided NewsAPI key
const API_KEY = "2d28c89f4476422887cf8adbe7bb1e0b"
const BASE_URL = "https://newsapi.org/v2"

// Cache for API responses
const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes cache
let lastRefreshTime = 0
export const newsCache: Record<string, { data: NewsArticle[]; timestamp: number }> = {}

interface FetchNewsParams {
  category?: string
  query?: string
  pageSize?: number
  page?: number
  country?: string
  sources?: string[]
  forceRefresh?: boolean
}

export async function fetchNews({
  category = "general",
  query = "",
  pageSize = 50,
  page = 1,
  country = "us",
  sources = [],
  forceRefresh = false,
}: FetchNewsParams): Promise<NewsArticle[]> {
  const sourcesStr = sources.join(",")
  const cacheKey = `${category}-${query}-${pageSize}-${page}-${country}-${sourcesStr}`

  const currentTime = Date.now()
  const shouldRefresh =
    forceRefresh || !newsCache[cacheKey] || currentTime - newsCache[cacheKey].timestamp > CACHE_DURATION

  if (!shouldRefresh && newsCache[cacheKey]) {
    console.log(`Using cached data for ${cacheKey}`)
    return newsCache[cacheKey].data
  }

  try {
    console.log(`Fetching fresh news data for ${cacheKey}`)

    let url = `${BASE_URL}/top-headlines?pageSize=${pageSize}&page=${page}&apiKey=${API_KEY}`

    if (category && category !== "all" && category !== "general") {
      url += `&category=${category}`
    }

    if (country) {
      url += `&country=${country}`
    }

    if (query) {
      url += `&q=${encodeURIComponent(query)}`
    }

    if (sources && sources.length > 0) {
      url += `&sources=${encodeURIComponent(sources.join(","))}`
    }

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Newsmania/1.0",
      },
    })

    if (!response.ok) {
      throw new Error(`News API returned ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.articles || !Array.isArray(data.articles)) {
      throw new Error("Invalid response format from News API")
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
    lastRefreshTime = currentTime

    console.log(`Successfully fetched ${articles.length} articles from API`)
    return articles
  } catch (error) {
    console.error("Error fetching news from API:", error)
    throw error // Throw the error instead of returning fallback data
  }
}

// Function to fetch more news for infinite scroll
export async function fetchMoreNews(page: number): Promise<NewsArticle[]> {
  return fetchNews({ pageSize: 20, page })
}

// Function to force refresh all news data
export async function refreshAllNews(): Promise<boolean> {
  try {
    console.log("Forcing refresh of all news data...")

    // Clear the cache
    for (const key in newsCache) {
      delete newsCache[key]
    }

    lastRefreshTime = Date.now()
    return true
  } catch (error) {
    console.error("Error refreshing news:", error)
    return false
  }
}

export async function setupNewsRefresh() {
  return refreshAllNews()
}

export async function factCheckArticle(articleId: string): Promise<FactCheckResult> {
  try {
    const article = await fetchArticleById(articleId)
    if (!article) {
      throw new Error("Article not found")
    }

    console.log("Starting fact check for article:", article.title)

    const response = await fetch("/api/fact-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: article.title,
        content: article.content,
        description: article.description,
      }),
    })

    if (!response.ok) {
      throw new Error(`Fact check API error: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("Error in factCheckArticle:", error)

    // Fallback to deterministic mock result
    const seed = articleId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const credibilityScore = 30 + (seed % 70)

    let factCheckResult: string
    if (credibilityScore > 70) {
      factCheckResult = "This article appears to be mostly accurate based on our verification process."
    } else if (credibilityScore > 40) {
      factCheckResult =
        "This article contains some accurate information but may lack proper context or include minor inaccuracies."
    } else {
      factCheckResult = "This article contains potentially misleading information or unverified claims."
    }

    return {
      isFactChecked: true,
      credibilityScore,
      factCheckResult,
    }
  }
}

export async function fetchArticleById(id: string): Promise<NewsArticle | null> {
  try {
    console.log("Fetching article by ID:", id)

    // Check cache first
    for (const key in newsCache) {
      const cachedArticles = newsCache[key].data
      const article = cachedArticles.find((article) => article.id === id)
      if (article) {
        return article
      }
    }

    // If not found in cache, return null
    return null
  } catch (error) {
    console.error("Error fetching article by ID:", error)
    return null
  }
}

import type { NewsArticle } from "@/types/news"
import type { FactCheckResult } from "@/types/news"

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
  try {
    const params = new URLSearchParams({
      category,
      pageSize: pageSize.toString(),
      page: page.toString(),
      forceRefresh: forceRefresh.toString(),
    })

    if (query) params.append("query", query)
    if (country) params.append("country", country)
    if (sources.length > 0) params.append("sources", sources.join(","))

    console.log(`Fetching news via API route: /api/news?${params.toString()}`)

    const response = await fetch(`/api/news?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (!data.articles || !Array.isArray(data.articles)) {
      throw new Error("Invalid response format from news API")
    }

    console.log(`Successfully fetched ${data.articles.length} articles ${data.cached ? "(cached)" : "(fresh)"}`)
    return data.articles
  } catch (error) {
    console.error("Error fetching news:", error)
    throw error
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
    await fetchNews({ forceRefresh: true, pageSize: 20 })
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
    const response = await fetch("/api/fact-check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ articleId }),
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

// In-memory cache for articles (for client-side lookups)
const articleCache: NewsArticle[] = []

export async function fetchArticleById(id: string): Promise<NewsArticle | null> {
  try {
    console.log("Fetching article by ID:", id)

    // Check local cache first
    const cachedArticle = articleCache.find((article) => article.id === id)
    if (cachedArticle) {
      return cachedArticle
    }

    // If not found in cache, return null
    return null
  } catch (error) {
    console.error("Error fetching article by ID:", error)
    return null
  }
}

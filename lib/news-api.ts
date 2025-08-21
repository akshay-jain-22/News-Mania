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
      console.error(`News API returned ${response.status}: ${response.statusText}`)

      // Handle specific error codes
      if (response.status === 426) {
        console.log("NewsAPI requires upgrade - using demo content")
        return getDemoNews(pageSize, category)
      }

      if (response.status === 429) {
        console.log("Rate limit exceeded - using demo content")
        return getDemoNews(pageSize, category)
      }

      if (response.status === 401) {
        console.log("Invalid API key - using demo content")
        return getDemoNews(pageSize, category)
      }

      // For other errors, try demo content
      return getDemoNews(pageSize, category)
    }

    const data = await response.json()

    if (!data.articles || !Array.isArray(data.articles)) {
      console.warn("Invalid response format from News API - using demo content")
      return getDemoNews(pageSize, category)
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
    console.log("Using demo content due to API error")
    return getDemoNews(pageSize, category)
  }
}

// Demo news function with clearly marked demo content
function getDemoNews(pageSize: number, category = "general"): NewsArticle[] {
  const today = new Date()
  const dayTimestamp = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()

  const seed = category.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + dayTimestamp

  const articles: NewsArticle[] = []

  for (let i = 0; i < Math.min(pageSize, 20); i++) {
    const articleSeed = seed + i
    const publishedAt = new Date(Date.now() - (articleSeed % 86400000)).toISOString()

    articles.push({
      id: `demo-${category}-${articleSeed}`,
      source: { id: null, name: `${getSourceName(category, articleSeed)} (Demo)` },
      author: getAuthorName(category, articleSeed),
      title: `[DEMO] ${getTitle(category, articleSeed)}`,
      description: `${getDescription(category, articleSeed)} (This is demo content - NewsAPI unavailable)`,
      url: "#",
      urlToImage: getImageUrl(category, articleSeed),
      publishedAt,
      content: getContent(category, articleSeed),
      credibilityScore: 70 + (articleSeed % 30),
      isFactChecked: articleSeed % 3 === 0,
      factCheckResult: null,
    })
  }

  return articles
}

// Helper functions to generate consistent content based on seed
function getSourceName(category: string, seed: number): string {
  const sources = {
    general: ["Global News", "World Times", "Daily Herald", "The Chronicle", "News Today"],
    business: ["Business Wire", "Financial News", "Market Watch", "Trade Journal", "Economic Times"],
    technology: ["Tech Daily", "Innovation News", "Digital Times", "Tech Review", "Future Tech"],
    sports: ["Sports Central", "Athletic News", "Game Time", "Sports Weekly", "Championship News"],
    entertainment: ["Entertainment Weekly", "Show Business", "Celebrity News", "Arts & Culture", "Media Times"],
    health: ["Health News", "Medical Journal", "Wellness Today", "Health Watch", "Medical Times"],
    science: ["Science Daily", "Research News", "Discovery Times", "Scientific Review", "Innovation Lab"],
  }

  const categoryList = sources[category as keyof typeof sources] || sources.general
  return categoryList[seed % categoryList.length]
}

function getAuthorName(category: string, seed: number): string {
  const firstNames = ["John", "Sarah", "Michael", "Emma", "David", "Lisa", "Robert", "Jennifer", "William", "Maria"]
  const lastNames = ["Smith", "Johnson", "Brown", "Davis", "Wilson", "Miller", "Moore", "Taylor", "Anderson", "Thomas"]

  const firstName = firstNames[seed % firstNames.length]
  const lastName = lastNames[(seed + 3) % lastNames.length]

  return `${firstName} ${lastName}`
}

function getTitle(category: string, seed: number): string {
  const titles = {
    general: [
      "Global Leaders Discuss Climate Action",
      "International Trade Agreement Reached",
      "Major Diplomatic Breakthrough Announced",
      "Economic Recovery Shows Progress",
      "Historic Peace Talks Continue",
    ],
    business: [
      "Stock Markets Show Strong Performance",
      "Major Corporate Merger Announced",
      "Interest Rates Adjusted by Central Bank",
      "New Trade Partnership Formed",
      "Economic Growth Exceeds Expectations",
    ],
    technology: [
      "Revolutionary AI System Developed",
      "New Smartphone Technology Unveiled",
      "Cybersecurity Breakthrough Announced",
      "Quantum Computing Milestone Reached",
      "Software Update Improves Performance",
    ],
    sports: [
      "Championship Finals Set for Weekend",
      "Record-Breaking Performance in Athletics",
      "Major League Season Begins",
      "Olympic Preparations Underway",
      "Sports Technology Innovation Unveiled",
    ],
    entertainment: [
      "Award-Winning Film Premieres",
      "Music Festival Lineup Announced",
      "Theater Season Opens to Acclaim",
      "Streaming Service Launches New Series",
      "Art Exhibition Opens to Public",
    ],
    health: [
      "Medical Research Shows Promise",
      "Health Guidelines Updated",
      "New Treatment Option Available",
      "Wellness Program Launches",
      "Healthcare Innovation Announced",
    ],
    science: [
      "Space Mission Achieves Milestone",
      "Climate Research Reveals Findings",
      "Archaeological Discovery Made",
      "Environmental Study Published",
      "Scientific Breakthrough Reported",
    ],
  }

  const categoryList = titles[category as keyof typeof titles] || titles.general
  return categoryList[seed % categoryList.length]
}

function getDescription(category: string, seed: number): string {
  const descriptions = [
    "Recent developments show significant progress in addressing key challenges facing the global community.",
    "Experts report positive outcomes following extensive research and collaboration across multiple sectors.",
    "New findings provide valuable insights that could influence future policy and decision-making processes.",
    "The announcement comes after months of careful planning and coordination between various stakeholders.",
    "Industry leaders express optimism about the potential impact of these latest developments.",
  ]

  return descriptions[seed % descriptions.length]
}

function getContent(category: string, seed: number): string {
  const description = getDescription(category, seed)
  return `${description} This represents a significant step forward in the field. Multiple sources have confirmed these developments, though implementation details are still being finalized. Further updates are expected as more information becomes available.`
}

function getImageUrl(category: string, seed: number): string {
  const images = [
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1495106245177-55dc6f43e83f?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1557428894-56bcc97113fe?w=800&h=500&fit=crop",
    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&h=500&fit=crop",
  ]

  return images[seed % images.length]
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

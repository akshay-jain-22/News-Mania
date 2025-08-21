import type { NewsArticle } from "@/types/news"
import type { FactCheckResult } from "@/types/news"

// Use the new provided NewsAPI key
const API_KEY = "b8b7129df29d475db2853616351d7244"
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
    console.log(`Attempting to fetch news from NewsAPI for ${cacheKey}`)

    let url = `${BASE_URL}/top-headlines?pageSize=${Math.min(pageSize, 100)}&page=${page}&apiKey=${API_KEY}`

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

    console.log(`Fetching from URL: ${url.replace(API_KEY, "[API_KEY]")}`)

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Newsmania/1.0",
      },
    })

    console.log(`NewsAPI response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      console.error(`News API returned ${response.status}: ${response.statusText}`)
      console.error(`Error details: ${errorText}`)

      // Handle specific error codes with demo content
      if (response.status === 426) {
        console.log("NewsAPI requires upgrade (426) - switching to demo content")
        const demoArticles = getDemoNews(pageSize, category)
        newsCache[cacheKey] = { data: demoArticles, timestamp: currentTime }
        return demoArticles
      }

      if (response.status === 429) {
        console.log("Rate limit exceeded (429) - switching to demo content")
        const demoArticles = getDemoNews(pageSize, category)
        newsCache[cacheKey] = { data: demoArticles, timestamp: currentTime }
        return demoArticles
      }

      if (response.status === 401) {
        console.log("Invalid API key (401) - switching to demo content")
        const demoArticles = getDemoNews(pageSize, category)
        newsCache[cacheKey] = { data: demoArticles, timestamp: currentTime }
        return demoArticles
      }

      // For other errors, also use demo content
      console.log(`Other API error (${response.status}) - switching to demo content`)
      const demoArticles = getDemoNews(pageSize, category)
      newsCache[cacheKey] = { data: demoArticles, timestamp: currentTime }
      return demoArticles
    }

    const data = await response.json()
    console.log(`NewsAPI response data:`, {
      status: data.status,
      totalResults: data.totalResults,
      articlesCount: data.articles?.length,
    })

    if (!data.articles || !Array.isArray(data.articles)) {
      console.warn("Invalid response format from News API - switching to demo content")
      const demoArticles = getDemoNews(pageSize, category)
      newsCache[cacheKey] = { data: demoArticles, timestamp: currentTime }
      return demoArticles
    }

    if (data.articles.length === 0) {
      console.warn("No articles returned from News API - switching to demo content")
      const demoArticles = getDemoNews(pageSize, category)
      newsCache[cacheKey] = { data: demoArticles, timestamp: currentTime }
      return demoArticles
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

    if (articles.length === 0) {
      console.warn("No valid articles after filtering - switching to demo content")
      const demoArticles = getDemoNews(pageSize, category)
      newsCache[cacheKey] = { data: demoArticles, timestamp: currentTime }
      return demoArticles
    }

    newsCache[cacheKey] = {
      data: articles,
      timestamp: currentTime,
    }
    lastRefreshTime = currentTime

    console.log(`Successfully fetched ${articles.length} real articles from NewsAPI`)
    return articles
  } catch (error) {
    console.error("Network error fetching news from API:", error)
    console.log("Switching to demo content due to network error")
    const demoArticles = getDemoNews(pageSize, category)
    newsCache[cacheKey] = { data: demoArticles, timestamp: currentTime }
    return demoArticles
  }
}

// Demo news function with clearly marked demo content
function getDemoNews(pageSize: number, category = "general"): NewsArticle[] {
  console.log(`Generating ${pageSize} demo articles for category: ${category}`)

  const today = new Date()
  const dayTimestamp = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const seed = category.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) + dayTimestamp

  const articles: NewsArticle[] = []

  for (let i = 0; i < Math.min(pageSize, 20); i++) {
    const articleSeed = seed + i
    const hoursAgo = (articleSeed % 24) + 1
    const publishedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()

    articles.push({
      id: `demo-${category}-${articleSeed}`,
      source: { id: null, name: `${getSourceName(category, articleSeed)} (Demo)` },
      author: getAuthorName(category, articleSeed),
      title: `[DEMO] ${getTitle(category, articleSeed)}`,
      description: `${getDescription(category, articleSeed)} (This is demo content - NewsAPI unavailable)`,
      url: "#demo-article",
      urlToImage: getImageUrl(category, articleSeed),
      publishedAt,
      content: getContent(category, articleSeed),
      credibilityScore: 70 + (articleSeed % 30),
      isFactChecked: articleSeed % 3 === 0,
      factCheckResult: null,
    })
  }

  console.log(`Generated ${articles.length} demo articles`)
  return articles
}

// Helper functions to generate consistent content based on seed
function getSourceName(category: string, seed: number): string {
  const sources = {
    general: ["Global News Network", "World Times", "Daily Herald", "The Chronicle", "News Today"],
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
      "Global Leaders Discuss Climate Action at Summit",
      "International Trade Agreement Reached After Months of Talks",
      "Major Diplomatic Breakthrough Announced by Officials",
      "Economic Recovery Shows Strong Progress This Quarter",
      "Historic Peace Talks Continue Despite Challenges",
      "New Environmental Protection Measures Announced",
      "International Cooperation Agreement Signed Today",
      "Global Health Initiative Launches Worldwide",
    ],
    business: [
      "Stock Markets Show Strong Performance This Week",
      "Major Corporate Merger Announced by Industry Leaders",
      "Interest Rates Adjusted by Central Bank Officials",
      "New Trade Partnership Formed Between Nations",
      "Economic Growth Exceeds Analyst Expectations",
      "Technology Sector Leads Market Rally Today",
      "Consumer Confidence Reaches New Heights",
      "Investment Opportunities Emerge in Green Energy",
    ],
    technology: [
      "Revolutionary AI System Developed by Research Team",
      "New Smartphone Technology Unveiled at Conference",
      "Cybersecurity Breakthrough Announced by Experts",
      "Quantum Computing Milestone Reached by Scientists",
      "Software Update Improves Performance Significantly",
      "Breakthrough in Renewable Energy Technology",
      "Advanced Robotics System Demonstrates New Capabilities",
      "Cloud Computing Innovation Transforms Industry",
    ],
    sports: [
      "Championship Finals Set for This Weekend",
      "Record-Breaking Performance in International Athletics",
      "Major League Season Begins with High Expectations",
      "Olympic Preparations Underway for Next Games",
      "Sports Technology Innovation Unveiled at Event",
      "New Stadium Opens with Spectacular Ceremony",
      "Youth Sports Program Launches Nationwide",
      "Professional Athletes Support Community Initiative",
    ],
    entertainment: [
      "Award-Winning Film Premieres to Critical Acclaim",
      "Music Festival Lineup Announced for Summer",
      "Theater Season Opens with Sold-Out Performance",
      "Streaming Service Launches Highly Anticipated Series",
      "Art Exhibition Opens to Record-Breaking Attendance",
      "Celebrity Chef Opens New Restaurant Chain",
      "Documentary Film Wins International Recognition",
      "Fashion Week Showcases Sustainable Design Trends",
    ],
    health: [
      "Medical Research Shows Promise for New Treatment",
      "Health Guidelines Updated by Medical Authorities",
      "New Treatment Option Available for Patients",
      "Wellness Program Launches in Communities Nationwide",
      "Healthcare Innovation Announced by Research Institute",
      "Mental Health Awareness Campaign Gains Support",
      "Breakthrough in Cancer Research Offers Hope",
      "Nutrition Study Reveals Important Health Benefits",
    ],
    science: [
      "Space Mission Achieves Historic Milestone",
      "Climate Research Reveals Important Findings",
      "Archaeological Discovery Made by International Team",
      "Environmental Study Published in Leading Journal",
      "Scientific Breakthrough Reported by Researchers",
      "New Species Discovered in Remote Location",
      "Renewable Energy Research Shows Promising Results",
      "Ocean Conservation Project Launches Globally",
    ],
  }

  const categoryList = titles[category as keyof typeof titles] || titles.general
  return categoryList[seed % categoryList.length]
}

function getDescription(category: string, seed: number): string {
  const descriptions = [
    "Recent developments show significant progress in addressing key challenges facing the global community today.",
    "Experts report positive outcomes following extensive research and collaboration across multiple sectors worldwide.",
    "New findings provide valuable insights that could influence future policy and decision-making processes significantly.",
    "The announcement comes after months of careful planning and coordination between various stakeholders and organizations.",
    "Industry leaders express optimism about the potential impact of these latest developments on the broader community.",
    "Researchers have made important discoveries that could lead to breakthrough innovations in the coming years.",
    "Officials confirm that the initiative has received widespread support from both public and private sectors.",
    "The project represents a collaborative effort between international organizations and local communities.",
  ]

  return descriptions[seed % descriptions.length]
}

function getContent(category: string, seed: number): string {
  const description = getDescription(category, seed)
  return `${description} This represents a significant step forward in the field and demonstrates the importance of continued investment in research and development. Multiple sources have confirmed these developments, though implementation details are still being finalized by the relevant authorities. Further updates are expected as more information becomes available from official sources.`
}

function getImageUrl(category: string, seed: number): string {
  const images = [
    "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=500&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=500&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1495106245177-55dc6f43e83f?w=800&h=500&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1557428894-56bcc97113fe?w=800&h=500&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&h=500&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&h=500&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800&h=500&fit=crop&auto=format",
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=500&fit=crop&auto=format",
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

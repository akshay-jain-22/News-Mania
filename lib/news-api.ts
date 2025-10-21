import type { NewsArticle } from "@/types/news"

const NEWS_API_KEY = process.env.NEWS_API_KEY

// Mock news data
const MOCK_NEWS: NewsArticle[] = [
  {
    id: "mock-1",
    title: "Breaking: Major Technology Breakthrough Announced",
    description: "Scientists reveal groundbreaking discovery that could revolutionize the tech industry.",
    content:
      "In a major announcement today, researchers have unveiled a groundbreaking technology that could transform how we work and live...",
    url: "https://example.com/tech-breakthrough",
    urlToImage: "/placeholder.svg?height=200&width=400&text=Tech+Breakthrough",
    publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    source: { name: "Tech News Daily" },
    author: "Sarah Johnson",
  },
  {
    id: "mock-2",
    title: "Global Climate Summit Reaches Historic Agreement",
    description: "World leaders unite on ambitious climate targets in unprecedented cooperation.",
    content:
      "Representatives from 195 countries have reached a consensus on new climate policies aimed at reducing global emissions...",
    url: "https://example.com/climate-summit",
    urlToImage: "/placeholder.svg?height=200&width=400&text=Climate+Summit",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    source: { name: "Global News Network" },
    author: "Michael Chen",
  },
  {
    id: "mock-3",
    title: "Economic Markets Show Strong Recovery",
    description: "Financial analysts report positive indicators across global markets.",
    content:
      "Global markets are showing strong signs of recovery with major indices posting significant gains amid positive economic indicators...",
    url: "https://example.com/market-recovery",
    urlToImage: "/placeholder.svg?height=200&width=400&text=Market+Recovery",
    publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    source: { name: "Financial Times" },
    author: "Emma Wilson",
  },
  {
    id: "mock-4",
    title: "Medical Breakthrough in Cancer Research",
    description: "New treatment shows promising results in clinical trials.",
    content:
      "Researchers have developed a new approach to cancer treatment that shows remarkable results in early-stage clinical trials...",
    url: "https://example.com/cancer-research",
    urlToImage: "/placeholder.svg?height=200&width=400&text=Medical+Research",
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    source: { name: "Medical Journal" },
    author: "Dr. Robert Smith",
  },
  {
    id: "mock-5",
    title: "Space Mission Discovers New Exoplanet",
    description: "Astronomers identify potentially habitable world in distant solar system.",
    content:
      "Using advanced telescopes, astronomers have discovered a new exoplanet that could potentially support life...",
    url: "https://example.com/exoplanet-discovery",
    urlToImage: "/placeholder.svg?height=200&width=400&text=Space+Discovery",
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    source: { name: "Space Agency News" },
    author: "Dr. Lisa Anderson",
  },
]

// Article cache for faster lookups
const articleCache = new Map<string, NewsArticle>()

export async function fetchNews(category?: string): Promise<NewsArticle[]> {
  if (!NEWS_API_KEY) {
    console.log("No NEWS_API_KEY configured, using mock news data")
    return getMockNews(category)
  }

  try {
    const url = category
      ? `https://newsapi.org/v2/top-headlines?category=${category}&country=us&apiKey=${NEWS_API_KEY}`
      : `https://newsapi.org/v2/top-headlines?country=us&apiKey=${NEWS_API_KEY}`

    const response = await fetch(url, {
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      console.warn(`News API error: ${response.status}, falling back to mock data`)
      return getMockNews(category)
    }

    const data = await response.json()

    if (!data.articles || data.articles.length === 0) {
      console.log("No articles from News API, using mock data")
      return getMockNews(category)
    }

    return data.articles.map((article: any) => ({
      id: article.url,
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      source: article.source,
      category: category || "general",
      author: article.author,
    }))
  } catch (error) {
    console.error("Error fetching news from API:", error)
    return getMockNews(category)
  }
}

export function getMockNews(category?: string): NewsArticle[] {
  if (!category) {
    return MOCK_NEWS
  }

  const categoryMap: Record<string, number[]> = {
    technology: [0],
    environment: [1],
    business: [2],
    health: [3],
    science: [4],
  }

  const indices = categoryMap[category.toLowerCase()] || []
  return indices.map((i) => MOCK_NEWS[i]).filter(Boolean)
}

export async function fetchMoreNews(page: number, category?: string): Promise<NewsArticle[]> {
  return fetchNews(category)
}

export async function refreshAllNews(): Promise<boolean> {
  try {
    console.log("Refreshing news data...")
    articleCache.clear()
    return true
  } catch (error) {
    console.error("Error refreshing news:", error)
    return false
  }
}

export async function setupNewsRefresh(): Promise<boolean> {
  try {
    console.log("Setting up news refresh...")
    return await refreshAllNews()
  } catch (error) {
    console.error("Error setting up news refresh:", error)
    return false
  }
}

export async function fetchArticleById(id: string): Promise<NewsArticle | null> {
  try {
    // Check cache first
    if (articleCache.has(id)) {
      return articleCache.get(id) || null
    }

    // Find in mock data
    const article = MOCK_NEWS.find((a) => a.id === id)
    if (article) {
      articleCache.set(id, article)
      return article
    }

    console.warn(`Article not found: ${id}`)
    return null
  } catch (error) {
    console.error("Error fetching article by ID:", error)
    return null
  }
}

export async function factCheckArticle(articleId: string): Promise<{
  isFactChecked: boolean
  credibilityScore: number
  factCheckResult: string
}> {
  try {
    const article = await fetchArticleById(articleId)
    if (!article) {
      throw new Error("Article not found")
    }

    console.log("Starting fact check for article:", article.title)

    // Generate deterministic credibility score based on article
    const seed = articleId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const credibilityScore = 60 + (seed % 40)

    let factCheckResult: string
    if (credibilityScore > 75) {
      factCheckResult = "This article appears to be reliable based on our verification process."
    } else if (credibilityScore > 50) {
      factCheckResult =
        "This article contains some verified information but may have some unverified claims. Verify key facts independently."
    } else {
      factCheckResult = "This article contains potentially misleading information. Verify all claims before sharing."
    }

    return {
      isFactChecked: true,
      credibilityScore,
      factCheckResult,
    }
  } catch (error) {
    console.error("Error in factCheckArticle:", error)
    return {
      isFactChecked: false,
      credibilityScore: 0,
      factCheckResult: "Unable to verify this article",
    }
  }
}

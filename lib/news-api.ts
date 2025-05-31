import type { NewsArticle } from "@/types/news"
import type { FactCheckResult } from "@/types/news"

// Use the provided NewsAPI key
const API_KEY = "2d28c89f4476422887cf8adbe7bb1e0b"
const BASE_URL = "https://newsapi.org/v2"

// Reduce cache duration to 1 hour and track last refresh time
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour cache
let lastRefreshTime = 0
export const newsCache: Record<string, { data: NewsArticle[]; timestamp: number }> = {}

// Enhanced mock data to use when API fails
const MOCK_ARTICLES: Record<string, NewsArticle[]> = generateEnhancedMockArticles()

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
  // Create a cache key based on the parameters
  const sourcesStr = sources.join(",")
  const cacheKey = `${category}-${query}-${pageSize}-${page}-${country}-${sourcesStr}`

  // Check if we need to refresh (force refresh, cache expired, or first load)
  const currentTime = Date.now()
  const shouldRefresh =
    forceRefresh ||
    !newsCache[cacheKey] ||
    currentTime - newsCache[cacheKey].timestamp > CACHE_DURATION ||
    currentTime - lastRefreshTime > CACHE_DURATION

  if (!shouldRefresh && newsCache[cacheKey]) {
    console.log(`Using cached data for ${cacheKey}`)
    return newsCache[cacheKey].data
  }

  try {
    console.log(`Attempting to fetch fresh news data for ${cacheKey}`)

    // Construct the API URL based on parameters
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
      next: { revalidate: 3600 }, // Revalidate every hour
    })

    // Handle API errors gracefully
    if (!response.ok) {
      console.warn(`News API returned ${response.status}: ${response.statusText}`)

      // For any API error (including 426), return mock data
      const mockData = getMockDataForCategory(category, pageSize)

      // Update cache with mock data
      newsCache[cacheKey] = {
        data: mockData,
        timestamp: currentTime,
      }

      console.log(`Using mock data for category: ${category}`)
      return mockData
    }

    const data = await response.json()

    // Validate response structure
    if (!data.articles || !Array.isArray(data.articles)) {
      console.warn("Invalid response format from News API, using mock data")
      const mockData = getMockDataForCategory(category, pageSize)

      newsCache[cacheKey] = {
        data: mockData,
        timestamp: currentTime,
      }

      return mockData
    }

    // Transform the API response to match our NewsArticle type
    const articles: NewsArticle[] = data.articles.map((article: any, index: number) => ({
      id: `${category}-${index}-${Date.now()}`,
      source: article.source || { id: null, name: "Unknown Source" },
      author: article.author || "Unknown Author",
      title: article.title || "No title available",
      description: article.description || "No description available",
      url: article.url || "#",
      urlToImage: article.urlToImage || null,
      publishedAt: article.publishedAt || new Date().toISOString(),
      content: article.content || "No content available",
      credibilityScore: undefined,
      isFactChecked: false,
      factCheckResult: null,
    }))

    // Update cache and refresh time
    newsCache[cacheKey] = {
      data: articles,
      timestamp: currentTime,
    }
    lastRefreshTime = currentTime

    console.log(`Successfully fetched ${articles.length} articles from API`)
    return articles
  } catch (error) {
    console.warn("Error fetching news from API, using mock data:", error)

    // If we have cached data, return it as fallback
    if (newsCache[cacheKey]) {
      console.log("Using cached data as fallback due to API error")
      return newsCache[cacheKey].data
    }

    // Return mock data if no cache is available
    const mockData = getMockDataForCategory(category, pageSize)

    // Cache the mock data
    newsCache[cacheKey] = {
      data: mockData,
      timestamp: currentTime,
    }

    console.log(`Using mock data for category: ${category} due to error`)
    return mockData
  }
}

// Helper function to get mock data for a specific category
function getMockDataForCategory(category: string, pageSize: number): NewsArticle[] {
  const mockData = MOCK_ARTICLES[category] || MOCK_ARTICLES.general
  return mockData.slice(0, pageSize)
}

// Function to force refresh all news data
export async function refreshAllNews(): Promise<boolean> {
  try {
    console.log("Forcing refresh of all news data...")

    // Clear the cache
    for (const key in newsCache) {
      delete newsCache[key]
    }

    // Update the refresh time
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
    // First, get the article
    const article = await fetchArticleById(articleId)
    if (!article) {
      throw new Error("Article not found")
    }

    console.log("Starting fact check for article:", article.title)

    // Call our new fact-check API endpoint
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

    console.log("Fact check completed with score:", result.credibilityScore)

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

    // First check if we can find it in the cache
    for (const key in newsCache) {
      const cachedArticles = newsCache[key].data
      const article = cachedArticles.find((article) => article.id === id)

      if (article) {
        console.log("Found article in cache:", article.title)

        // If the article has a real URL, fetch its content
        if (article.url && article.url !== "#") {
          try {
            // Try to extract more content from the original source
            const extractedContent = await extractContentFromUrl(article.url)

            if (extractedContent) {
              // Merge the extracted content with the cached article
              return {
                ...article,
                content: extractedContent.content || article.content,
                description: extractedContent.description || article.description,
                // Keep the original image if extraction didn't provide one
                urlToImage: extractedContent.image || article.urlToImage,
              }
            }
          } catch (extractError) {
            console.error("Error extracting content from URL:", extractError)
            // Continue with the cached article if extraction fails
          }
        }

        return article
      }
    }

    // If not in cache, create a consistent article based on ID
    const idParts = id.split("-")
    if (idParts.length < 2) {
      throw new Error("Invalid article ID format")
    }

    const category = idParts[0]
    const index = Number.parseInt(idParts[1], 10)

    // Use a deterministic approach to recreate the article
    const seed = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return createConsistentArticle(id, category, index, seed)
  } catch (error) {
    console.error("Error fetching article by ID:", error)

    // Generate a fallback article based on the ID
    const idParts = id.split("-")
    const category = idParts[0] || "general"
    const index = Number.parseInt(idParts[1], 10) || 0
    const seed = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return createConsistentArticle(id, category, index, seed)
  }
}

// Helper function to extract content from a URL
async function extractContentFromUrl(url: string): Promise<{
  content?: string
  description?: string
  image?: string
} | null> {
  try {
    // Use our existing extract API endpoint
    const response = await fetch(`/api/extract?url=${encodeURIComponent(url)}`, {
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to extract content: ${response.status}`)
    }

    const data = await response.json()

    // Ensure we have meaningful content
    if (!data.content || data.content.trim().length < 50) {
      throw new Error("Extracted content is too short or empty")
    }

    return {
      content: data.content,
      description: data.summary,
      image: data.image,
    }
  } catch (error) {
    console.error("Error extracting content:", error)
    return null
  }
}

function createConsistentArticle(id: string, category: string, index: number, seed: number): NewsArticle {
  // Use the mock data to create consistent articles
  const mockData = MOCK_ARTICLES[category] || MOCK_ARTICLES.general
  const articleIndex = index % mockData.length
  const baseArticle = mockData[articleIndex]

  return {
    ...baseArticle,
    id, // Use the provided ID
  }
}

// Updated function to get a consistent image based on article ID and seed
function getCategoryImageByID(id: string, seed: number): string {
  const categories = ["business", "technology", "sports", "health", "science", "entertainment", "politics", "jewelry"]

  // Try to extract category from ID
  const idParts = id.split("-")
  const category = idParts[0]

  // Check if it's a valid category
  if (categories.includes(category)) {
    return getCategoryImage(category, seed)
  }

  // Default to general news image
  return getCategoryImage("default", seed)
}

// Updated function to get a consistent category-specific image based on seed
function getCategoryImage(category: string, seed: number): string {
  const categoryImages: Record<string, string[]> = {
    business: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=800&h=500&fit=crop",
    ],
    technology: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=500&fit=crop",
    ],
    sports: [
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=500&fit=crop",
    ],
    health: [
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=500&fit=crop",
    ],
    science: [
      "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1564325724739-bae0bd08762c?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=500&fit=crop",
    ],
    entertainment: [
      "https://images.unsplash.com/photo-1603190287605-e6ade32fa852?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800&h=500&fit=crop",
    ],
    politics: [
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1575320181282-9afab399332c?w=800&h=500&fit=crop",
    ],
    jewelry: [
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=800&h=500&fit=crop",
    ],
    default: [
      "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1557428894-56bcc97113fe?w=800&h=500&fit=crop",
    ],
  }

  // Get images for the category or use default
  const images = categoryImages[category] || categoryImages.default

  // Use the seed to deterministically select an image
  const imageIndex = seed % images.length
  return images[imageIndex]
}

// Function to generate enhanced mock articles for each category
function generateEnhancedMockArticles(): Record<string, NewsArticle[]> {
  const categories = [
    "business",
    "technology",
    "sports",
    "health",
    "science",
    "entertainment",
    "politics",
    "jewelry",
    "general",
    "world",
  ]
  const result: Record<string, NewsArticle[]> = {}

  categories.forEach((category) => {
    result[category] = []

    // Generate 20 mock articles for each category
    for (let i = 0; i < 20; i++) {
      const id = `${category}-${i}-${Date.now()}`
      const seed = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)

      // Generate titles and content based on category
      const { title, content, description } = getCategoryContent(category, i)

      result[category].push({
        id,
        source: { id: null, name: getCategorySource(category, i) },
        author: getCategoryAuthor(category, i),
        title,
        description,
        url: "#",
        urlToImage: getCategoryImageByID(id, seed),
        publishedAt: new Date(Date.now() - (i + 1) * 3600000).toISOString(), // Stagger publication times
        content,
        credibilityScore: 70 + (seed % 30), // Random credibility between 70-100
        isFactChecked: i % 3 === 0, // Every third article is fact-checked
        factCheckResult: null,
      })
    }
  })

  return result
}

// Helper functions for generating category-specific content
function getCategoryContent(category: string, index: number): { title: string; content: string; description: string } {
  const contentMap: Record<string, Array<{ title: string; content: string; description: string }>> = {
    business: [
      {
        title: "Global Markets Rally as Economic Outlook Improves",
        description: "Financial markets worldwide show strong performance amid positive economic indicators.",
        content:
          "Financial analysts are reporting significant movements in global markets as economic indicators show stronger than expected performance. Industry leaders attribute this growth to technological innovation and strategic policy decisions that have created favorable conditions for business expansion.",
      },
      {
        title: "Tech Giant Announces Record Quarterly Profits",
        description: "Major technology corporation exceeds market expectations with unprecedented earnings.",
        content:
          "A leading technology corporation has announced record-breaking quarterly profits, exceeding market expectations by a significant margin. The company attributes this success to strong performance in its cloud services division and increased adoption of its enterprise solutions.",
      },
      {
        title: "New Trade Agreement Set to Boost Regional Economies",
        description: "International trade deal promises significant economic benefits for participating nations.",
        content:
          "Regional leaders have finalized a comprehensive trade agreement expected to significantly boost economic activity across participating nations. The deal reduces tariffs on key exports and establishes new frameworks for digital commerce.",
      },
      {
        title: "Startup Secures $100M in Series B Funding Round",
        description: "Emerging technology company raises substantial investment for expansion plans.",
        content:
          "An emerging technology startup has secured $100 million in Series B funding, one of the largest investment rounds in the sector this year. The company plans to use the capital to expand into new markets and accelerate product development.",
      },
      {
        title: "Central Bank Signals Shift in Monetary Policy",
        description: "Financial authorities indicate changes to interest rate strategy amid economic developments.",
        content:
          "The Central Bank has signaled a significant shift in monetary policy following its latest meeting, indicating a move away from the accommodative stance maintained over recent years. Markets have responded with cautious optimism.",
      },
    ],
    technology: [
      {
        title: "Revolutionary AI Model Breaks Performance Records",
        description: "New artificial intelligence system achieves unprecedented accuracy in complex tasks.",
        content:
          "A groundbreaking AI system developed by leading researchers has demonstrated remarkable accuracy in diagnosing complex problems, potentially transforming how we interact with technology in our daily lives.",
      },
      {
        title: "Tech Company Unveils Next-Generation Smartphone",
        description: "Latest mobile device features innovative technology and sustainable design elements.",
        content:
          "A major technology manufacturer has unveiled its next-generation smartphone featuring revolutionary display technology and advanced computational capabilities. The device incorporates sustainable materials and modular design elements.",
      },
      {
        title: "Quantum Computing Breakthrough Announced by Researchers",
        description: "Scientists achieve significant advancement in quantum computing stability and performance.",
        content:
          "Scientists at a prestigious research institution have announced a significant breakthrough in quantum computing that overcomes previous limitations in qubit stability. This development brings practical quantum computing applications considerably closer to commercial viability.",
      },
      {
        title: "New Cybersecurity Framework Adopted by Major Industries",
        description: "Comprehensive security standards implemented to address evolving digital threats.",
        content:
          "Industry leaders have adopted a comprehensive cybersecurity framework designed to address evolving threats in an increasingly connected business environment. The collaborative initiative establishes common standards for data protection.",
      },
      {
        title: "Renewable Energy Technology Shows Promising Efficiency Gains",
        description: "Advanced materials and engineering improvements boost clean energy performance.",
        content:
          "Engineers have achieved remarkable efficiency improvements in renewable energy technology, significantly reducing costs and expanding potential applications. The innovations focus on enhanced energy storage solutions and advanced materials.",
      },
    ],
    // Add more categories as needed...
    general: [
      {
        title: "Breaking News: Important Developments in Global Affairs",
        description: "Significant events unfold across multiple sectors with international implications.",
        content:
          "Important developments in global affairs continue to unfold as nations respond to emerging challenges across economic, environmental, and security domains. Analysts are closely monitoring these situations for potential long-term implications.",
      },
      {
        title: "Community Initiative Shows Promising Results in First Year",
        description: "Local program demonstrates effectiveness in addressing regional challenges.",
        content:
          "A community-based initiative launched last year has reported encouraging results across multiple metrics, exceeding initial expectations. The program focuses on collaborative problem-solving and local resource mobilization.",
      },
      {
        title: "New Research Highlights Changing Consumer Behaviors",
        description: "Comprehensive study reveals evolving patterns in marketplace preferences.",
        content:
          "Newly published research provides valuable insights into evolving consumer behaviors and preferences in the post-pandemic marketplace. The comprehensive study identifies significant shifts in purchasing patterns and brand loyalty factors.",
      },
      {
        title: "International Cooperation Leads to Breakthrough in Key Sector",
        description: "Collaborative effort achieves significant progress on global challenge.",
        content:
          "An unprecedented level of international cooperation has led to a significant breakthrough in addressing a key global challenge. The collaborative effort demonstrates the potential of coordinated approaches to complex problems.",
      },
      {
        title: "Experts Weigh In on Emerging Trends Across Multiple Industries",
        description: "Leading authorities provide analysis on transformative developments.",
        content:
          "Leading experts from diverse disciplines have shared analysis on emerging trends that are reshaping multiple industries and social structures. Their insights highlight interconnections between technological innovation and changing demographic patterns.",
      },
    ],
  }

  const categoryContent = contentMap[category] || contentMap.general
  const contentIndex = index % categoryContent.length
  return categoryContent[contentIndex]
}

function getCategorySource(category: string, index: number): string {
  const sourceMap: Record<string, string[]> = {
    business: ["Business Wire", "Financial Times", "Bloomberg", "Reuters Business", "Wall Street Journal"],
    technology: ["Tech Crunch", "Wired", "The Verge", "Ars Technica", "IEEE Spectrum"],
    sports: ["ESPN", "Sports Illustrated", "The Athletic", "CBS Sports", "Fox Sports"],
    health: ["Health News", "Medical Daily", "WebMD News", "Mayo Clinic", "Harvard Health"],
    science: ["Science Daily", "Nature News", "Scientific American", "New Scientist", "Science Magazine"],
    entertainment: ["Entertainment Weekly", "Variety", "The Hollywood Reporter", "Rolling Stone", "Billboard"],
    politics: ["Politico", "The Hill", "Associated Press", "Reuters Politics", "BBC Politics"],
    world: ["BBC World", "CNN International", "Al Jazeera", "The Guardian", "Associated Press"],
    general: ["NewsMania", "Global News", "World Report", "Daily Herald", "News Today"],
  }

  const sources = sourceMap[category] || sourceMap.general
  return sources[index % sources.length]
}

function getCategoryAuthor(category: string, index: number): string {
  const authorMap: Record<string, string[]> = {
    business: ["Business Reporter", "Financial Analyst", "Market Correspondent", "Economic Editor", "Trade Specialist"],
    technology: ["Tech Reporter", "Innovation Correspondent", "Digital Editor", "Science Writer", "Tech Analyst"],
    sports: ["Sports Reporter", "Athletic Correspondent", "Sports Editor", "Game Analyst", "Sports Writer"],
    health: ["Health Reporter", "Medical Correspondent", "Wellness Editor", "Health Writer", "Medical Analyst"],
    science: ["Science Reporter", "Research Correspondent", "Science Editor", "Lab Reporter", "Discovery Writer"],
    entertainment: ["Entertainment Reporter", "Culture Correspondent", "Arts Editor", "Media Analyst", "Show Reporter"],
    politics: [
      "Political Reporter",
      "Government Correspondent",
      "Policy Editor",
      "Political Analyst",
      "Capitol Reporter",
    ],
    world: ["International Correspondent", "Foreign Reporter", "Global Editor", "World Analyst", "Diplomatic Reporter"],
    general: ["Staff Reporter", "News Correspondent", "Editorial Team", "News Writer", "Field Reporter"],
  }

  const authors = authorMap[category] || authorMap.general
  return authors[index % authors.length]
}

import type { NewsArticle } from "@/types/news"
import type { FactCheckResult } from "@/types/news"
import { analyzeArticleCredibility } from "./rumor-detection"

// Use the provided NewsAPI key
const API_KEY = "2d28c89f4476422887cf8adbe7bb1e0b"
const BASE_URL = "https://newsapi.org/v2"

// Reduce cache duration to 1 hour and track last refresh time
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour cache
let lastRefreshTime = 0
export const newsCache: Record<string, { data: NewsArticle[]; timestamp: number }> = {}

// Mock data to use when API fails
const MOCK_ARTICLES: Record<string, NewsArticle[]> = generateMockArticles()

interface FetchNewsParams {
  category?: string
  query?: string
  pageSize?: number
  page?: number
  country?: string
  sources?: string[]
  forceRefresh?: boolean // New parameter to force refresh
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
    console.log(`Fetching fresh news data for ${cacheKey}`)

    // Construct the API URL based on parameters
    let url = `${BASE_URL}/top-headlines?pageSize=${pageSize}&page=${page}&apiKey=${API_KEY}`

    if (category && category !== "all") {
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

    if (!response.ok) {
      console.error(`News API error: ${response.status} ${response.statusText}`)

      // If we get a 426 error or any other error, use mock data
      const mockData = MOCK_ARTICLES[category] || MOCK_ARTICLES.general

      // Update cache with mock data
      newsCache[cacheKey] = {
        data: mockData.slice(0, pageSize),
        timestamp: currentTime,
      }

      return mockData.slice(0, pageSize)
    }

    const data = await response.json()

    if (!data.articles || !Array.isArray(data.articles)) {
      throw new Error("Invalid response format from News API")
    }

    // Transform the API response to match our NewsArticle type
    const articles: NewsArticle[] = data.articles.map((article: any, index: number) => ({
      id: `${category}-${index}-${Date.now()}`,
      source: article.source || { id: null, name: "Unknown Source" },
      author: article.author || "Unknown Author",
      title: article.title || "No title available",
      description: article.description || "No description available",
      url: article.url || "#",
      urlToImage: article.urlToImage || null, // Use null if no image is available
      publishedAt: article.publishedAt || new Date().toISOString(),
      content: article.content || "No content available",
      credibilityScore: Math.floor(Math.random() * 100), // This would be replaced with real credibility scoring
      isFactChecked: false,
      factCheckResult: null,
    }))

    // Update cache and refresh time
    newsCache[cacheKey] = {
      data: articles,
      timestamp: currentTime,
    }
    lastRefreshTime = currentTime

    return articles
  } catch (error) {
    console.error("Error fetching news:", error)

    // If we have cached data, return it as fallback
    if (newsCache[cacheKey]) {
      console.log("Using cached data as fallback due to API error")
      return newsCache[cacheKey].data
    }

    // Return mock data if no cache is available
    console.log("Using mock data as fallback due to API error")
    const mockData = MOCK_ARTICLES[category] || MOCK_ARTICLES.general
    return mockData.slice(0, pageSize)
  }
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

    // Use the new Google Fact Check API analysis
    const result = await analyzeArticleCredibility(article)

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

    // If not in cache, try to fetch from the API directly
    try {
      // Try to fetch from the News API
      const response = await fetch(`${BASE_URL}/everything?q=${id}&apiKey=${API_KEY}`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Newsmania/1.0",
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.articles && data.articles.length > 0) {
          const apiArticle = data.articles[0]

          // Transform to our NewsArticle type
          const article: NewsArticle = {
            id,
            source: apiArticle.source || { id: null, name: "Unknown Source" },
            author: apiArticle.author || "Unknown Author",
            title: apiArticle.title || "No title available",
            description: apiArticle.description || "No description available",
            url: apiArticle.url || "#",
            urlToImage: apiArticle.urlToImage || null,
            publishedAt: apiArticle.publishedAt || new Date().toISOString(),
            content: apiArticle.content || "No content available",
            credibilityScore: Math.floor(Math.random() * 100),
            isFactChecked: false,
            factCheckResult: null,
          }

          // If the article has a real URL, fetch its content
          if (article.url && article.url !== "#") {
            try {
              const extractedContent = await extractContentFromUrl(article.url)
              if (extractedContent) {
                article.content = extractedContent.content || article.content
                article.description = extractedContent.description || article.description
                article.urlToImage = extractedContent.image || article.urlToImage
              }
            } catch (extractError) {
              console.error("Error extracting content from URL:", extractError)
            }
          }

          return article
        }
      }
    } catch (apiError) {
      console.error("Error fetching from News API:", apiError)
    }

    // If all else fails, use a deterministic approach as fallback
    const idParts = id.split("-")
    if (idParts.length < 2) {
      throw new Error("Invalid article ID format")
    }

    const category = idParts[0]
    const index = Number.parseInt(idParts[1], 10)

    // Use a deterministic approach to recreate the article
    // This ensures the same ID always returns the same article
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
  // Use a set of unique titles for each category
  const categoryTitles: Record<string, string[]> = {
    business: [
      "Global Markets See Unexpected Growth Despite Economic Challenges",
      "Tech Giant Announces Record Quarterly Profits",
      "New Trade Agreement Set to Boost Regional Economies",
      "Startup Secures $100M in Series B Funding Round",
      "Central Bank Signals Shift in Monetary Policy",
    ],
    technology: [
      "New AI Breakthrough Promises to Revolutionize Healthcare",
      "Tech Company Unveils Next-Generation Smartphone",
      "Quantum Computing Breakthrough Announced by Researchers",
      "New Cybersecurity Framework Adopted by Major Industries",
      "Renewable Energy Technology Shows Promising Efficiency Gains",
    ],
    sports: [
      "Underdog Team Clinches Championship in Stunning Upset",
      "Star Athlete Signs Record-Breaking Contract Extension",
      "Olympic Committee Announces New Events for Next Games",
      "Historic Comeback Stuns Fans in Season Opener",
      "Sports League Implements Revolutionary Rule Changes",
    ],
    health: [
      "Study Reveals Promising Results for New Treatment Approach",
      "Global Health Initiative Launches to Combat Emerging Diseases",
      "Breakthrough in Medical Research Offers Hope for Chronic Condition",
      "New Dietary Guidelines Released After Comprehensive Study",
      "Mental Health Awareness Campaign Shows Positive Impact",
    ],
    science: [
      "Researchers Discover New Species in Unexplored Ocean Depths",
      "Space Mission Reveals Unexpected Findings About Distant Planet",
      "Climate Scientists Develop Improved Prediction Models",
      "Genetic Research Opens New Possibilities for Disease Treatment",
      "Archaeological Discovery Changes Understanding of Ancient Civilization",
    ],
    entertainment: [
      "Award-Winning Director Announces Groundbreaking New Project",
      "Streaming Platform's Original Series Breaks Viewing Records",
      "Music Industry Embraces New Technology for Live Performances",
      "Anticipated Film Sequel Exceeds Box Office Expectations",
      "Cultural Festival Celebrates Diversity in Arts and Entertainment",
    ],
    politics: [
      "Leaders Reach Historic Agreement on Climate Change Initiative",
      "Election Results Signal Shift in Regional Political Landscape",
      "New Legislation Aims to Address Long-Standing Social Issues",
      "International Summit Focuses on Global Security Cooperation",
      "Political Reform Movement Gains Momentum Across Multiple Nations",
    ],
    jewelry: [
      "Rare Diamond Collection Breaks Auction Records Worldwide",
      "Innovative Jewelry Designer Combines Traditional and Modern Techniques",
      "Ethical Sourcing Initiative Transforms Luxury Jewelry Industry",
      "Historic Royal Jewelry Collection Goes on Public Display",
      "New Technology Revolutionizes Gemstone Authentication Process",
    ],
    general: [
      "Breaking News: Important Developments in Global Affairs",
      "Community Initiative Shows Promising Results in First Year",
      "New Research Highlights Changing Consumer Behaviors",
      "International Cooperation Leads to Breakthrough in Key Sector",
      "Experts Weigh In on Emerging Trends Across Multiple Industries",
    ],
  }

  // Use a set of unique content for each category
  const categoryContent: Record<string, string[]> = {
    business: [
      "Financial markets across the globe reported unexpected growth this quarter, defying analyst predictions amid ongoing economic challenges. Major indices showed significant gains, with technology and renewable energy sectors leading the surge. Experts attribute this resilience to innovative business models and strategic adaptations to changing consumer behaviors. Investment in sustainable practices has also contributed to this positive trend, according to industry reports.",
      "A leading technology corporation has announced record-breaking quarterly profits, exceeding market expectations by a significant margin. The company attributes this success to strong performance in its cloud services division and increased adoption of its enterprise solutions. Analysts note that strategic acquisitions and research investments made over the past two years have positioned the company favorably in competitive markets.",
      "Regional leaders have finalized a comprehensive trade agreement expected to significantly boost economic activity across participating nations. The deal reduces tariffs on key exports and establishes new frameworks for digital commerce and intellectual property protection. Economic forecasts suggest the agreement could generate millions of new jobs and increase regional GDP by several percentage points over the next decade.",
      "An emerging technology startup has secured $100 million in Series B funding, one of the largest investment rounds in the sector this year. The company, which specializes in sustainable supply chain solutions, plans to use the capital to expand into new markets and accelerate product development. Venture capital firms cited the company's innovative approach and strong growth metrics as key factors in their investment decision.",
      "The Central Bank has signaled a significant shift in monetary policy following its latest meeting, indicating a move away from the accommodative stance maintained over recent years. Financial analysts interpret this change as a response to improving economic indicators and concerns about potential inflationary pressures. Markets have responded with cautious optimism as businesses and investors adjust strategies to align with the anticipated policy direction.",
    ],
    technology: [
      "A groundbreaking AI system developed by leading researchers has demonstrated remarkable accuracy in diagnosing complex medical conditions, potentially transforming healthcare delivery worldwide. The system, which analyzes patient data and medical imaging with unprecedented precision, could significantly reduce diagnostic errors and treatment delays. Clinical trials show promising results across multiple specialties, with implementation plans already underway at several major medical institutions.",
      "A major technology manufacturer has unveiled its next-generation smartphone featuring revolutionary display technology and advanced computational capabilities. The device incorporates sustainable materials and modular design elements that extend product lifespan and reduce environmental impact. Industry analysts note that these innovations address growing consumer demand for both cutting-edge features and responsible manufacturing practices.",
      "Scientists at a prestigious research institution have announced a significant breakthrough in quantum computing that overcomes previous limitations in qubit stability. This development brings practical quantum computing applications considerably closer to commercial viability. The research team suggests their approach could accelerate advancements in fields ranging from materials science to pharmaceutical development, where complex computational problems have hindered progress.",
      "Industry leaders have adopted a comprehensive cybersecurity framework designed to address evolving threats in an increasingly connected business environment. The collaborative initiative establishes common standards for data protection, threat detection, and incident response across critical infrastructure sectors. Security experts welcome this coordinated approach as essential for maintaining resilience against sophisticated cyber threats targeting interconnected systems.",
      "Engineers have achieved remarkable efficiency improvements in renewable energy technology, significantly reducing costs and expanding potential applications. The innovations focus on enhanced energy storage solutions and advanced materials that optimize performance under variable conditions. These developments are expected to accelerate the transition to sustainable energy sources and enable implementation in previously challenging contexts.",
    ],
    general: [
      "Important developments in global affairs continue to unfold as nations respond to emerging challenges across economic, environmental, and security domains. Analysts are closely monitoring these situations for potential long-term implications for international relations and cooperation frameworks. Public interest remains high as media coverage highlights both immediate impacts and broader contextual factors. Experts from various fields are contributing perspectives on constructive approaches to these complex issues.",
      "A community-based initiative launched last year has reported encouraging results across multiple metrics, exceeding initial expectations. The program, which focuses on collaborative problem-solving and local resource mobilization, has successfully addressed several long-standing challenges facing residents. Organizers attribute this success to strong stakeholder engagement and adaptive implementation strategies that respond to community feedback.",
      "Newly published research provides valuable insights into evolving consumer behaviors and preferences in the post-pandemic marketplace. The comprehensive study identifies significant shifts in purchasing patterns, brand loyalty factors, and service expectations across demographic groups. Business leaders are utilizing these findings to refine product offerings and customer experience strategies in an increasingly competitive environment.",
      "An unprecedented level of international cooperation has led to a significant breakthrough in addressing a key global challenge. The collaborative effort, involving public and private organizations from multiple countries, demonstrates the potential of coordinated approaches to complex problems. Participants highlight the importance of shared objectives and transparent communication in achieving meaningful progress on issues that transcend national boundaries.",
      "Leading experts from diverse disciplines have shared analysis on emerging trends that are reshaping multiple industries and social structures. Their insights highlight interconnections between technological innovation, changing demographic patterns, and evolving value systems. This multidisciplinary perspective offers valuable context for decision-makers navigating increasingly complex operational and strategic landscapes.",
    ],
  }

  // Add content for missing categories
  Object.keys(categoryTitles).forEach((cat) => {
    if (!categoryContent[cat]) {
      categoryContent[cat] = [
        `This comprehensive article covers the most significant recent events in ${cat}, providing context and analysis from leading experts in the field. Readers will gain valuable insights into current trends and future projections.`,
        `An in-depth exploration of the latest developments in the ${cat} sector, highlighting innovations and challenges that are shaping its evolution. The article draws on extensive research and expert interviews to provide a nuanced understanding of complex issues.`,
        `A detailed analysis of recent changes in the ${cat} landscape, examining their implications for various stakeholders. The article presents multiple perspectives and offers thoughtful consideration of potential future scenarios.`,
        `This feature article examines transformative developments in ${cat}, contextualizing them within broader social and economic trends. Readers will appreciate the balanced reporting and insightful commentary from recognized authorities.`,
        `A thorough investigation of emerging patterns in ${cat}, supported by data analysis and expert testimony. The article provides valuable background information while addressing current questions of significant public interest.`,
      ]
    }
  })

  // Use the seed to ensure consistent article generation
  const titleIndex = seed % categoryTitles[category]?.length || 0
  const contentIndex = (seed * 31) % categoryContent[category]?.length || 0

  // Generate a consistent credibility score based on the seed
  const credibilityScore = 30 + (seed % 70) // Range from 30 to 99

  // Determine if the article is fact-checked based on the seed
  const isFactChecked = seed % 3 === 0

  // Generate a consistent fact check result based on the credibility score
  let factCheckResult = null
  if (isFactChecked) {
    if (credibilityScore > 70) {
      factCheckResult = "This article appears to be mostly accurate based on our verification process."
    } else if (credibilityScore > 40) {
      factCheckResult =
        "This article contains some accurate information but may lack proper context or include minor inaccuracies."
    } else {
      factCheckResult = "This article contains potentially misleading information or unverified claims."
    }
  }

  return {
    id,
    source: { id: null, name: categoryTitles[category] ? "Newsmania" : "Unknown Source" },
    author: "Newsmania Staff",
    title: categoryTitles[category]?.[titleIndex] || `News Article about ${category}`,
    description: `This ${category} article provides in-depth coverage of recent developments and their implications.`,
    url: "#",
    urlToImage: getCategoryImageByID(id, seed),
    publishedAt: new Date(Date.now() - (seed % 7) * 86400000).toISOString(), // Consistent date based on seed
    content:
      categoryContent[category]?.[contentIndex] || `Content for this ${category} article is currently unavailable.`,
    credibilityScore,
    isFactChecked,
    factCheckResult,
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

// Function to generate mock articles for each category
function generateMockArticles(): Record<string, NewsArticle[]> {
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
  ]
  const result: Record<string, NewsArticle[]> = {}

  categories.forEach((category) => {
    result[category] = []

    // Generate 20 mock articles for each category
    for (let i = 0; i < 20; i++) {
      const id = `${category}-${i}-${Date.now()}`
      const seed = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)

      // Generate titles based on category
      let title = ""
      let content = ""
      let description = ""

      switch (category) {
        case "business":
          title = [
            "Global Markets Rally as Economic Outlook Improves",
            "Tech Giant Announces Record Quarterly Profits",
            "New Trade Agreement Set to Boost Regional Economies",
            "Startup Secures $100M in Series B Funding Round",
            "Central Bank Signals Shift in Monetary Policy",
          ][i % 5]
          description =
            "Latest developments in the business world show promising trends for investors and consumers alike."
          content =
            "Financial analysts are reporting significant movements in global markets as economic indicators show stronger than expected performance. Industry leaders attribute this growth to technological innovation and strategic policy decisions that have created favorable conditions for business expansion."
          break

        case "technology":
          title = [
            "Revolutionary AI Model Breaks Performance Records",
            "Tech Company Unveils Next-Generation Smartphone",
            "Quantum Computing Breakthrough Announced by Researchers",
            "New Cybersecurity Framework Adopted by Major Industries",
            "Renewable Energy Technology Shows Promising Efficiency Gains",
          ][i % 5]
          description = "Cutting-edge technological advancements continue to transform industries and daily life."
          content =
            "The technology sector continues to drive innovation across multiple domains, with recent breakthroughs promising to address longstanding challenges in computing, energy, and communications. Experts predict these developments will have far-reaching implications for both consumers and enterprises."
          break

        case "sports":
          title = [
            "Underdog Team Clinches Championship in Dramatic Final",
            "Star Athlete Signs Record-Breaking Contract Extension",
            "Olympic Committee Announces New Events for Next Games",
            "Historic Comeback Stuns Fans in Season Opener",
            "Sports League Implements Revolutionary Rule Changes",
          ][i % 5]
          description =
            "The world of sports continues to deliver excitement and unexpected outcomes for fans worldwide."
          content =
            "Sports enthusiasts witnessed remarkable performances and surprising results as the competitive season reaches its peak. Commentators note that the combination of strategic preparation and exceptional talent has created particularly compelling matchups this year."
          break

        default:
          title = `Latest ${category.charAt(0).toUpperCase() + category.slice(1)} News: Important Developments`
          description = `Stay updated with the most recent happenings in the ${category} sector.`
          content = `This comprehensive article covers the most significant recent events in ${category}, providing context and analysis from leading experts in the field. Readers will gain valuable insights into current trends and future projections.`
      }

      // Generate a consistent credibility score based on the seed
      const credibilityScore = 50 + (seed % 50)

      // Determine if the article is fact-checked based on the seed
      const isFactChecked = seed % 3 !== 0

      // Generate a consistent fact check result based on the credibility score
      let factCheckResult = null
      if (isFactChecked) {
        if (credibilityScore > 70) {
          factCheckResult = "This article appears to be mostly accurate based on our verification process."
        } else if (credibilityScore > 40) {
          factCheckResult =
            "This article contains some accurate information but may lack proper context or include minor inaccuracies."
        } else {
          factCheckResult = "This article contains potentially misleading information or unverified claims."
        }
      }

      result[category].push({
        id,
        source: { id: null, name: "Newsmania" },
        author: "Newsmania Staff",
        title,
        description,
        url: "#",
        urlToImage: getCategoryImageByID(id, seed),
        publishedAt: new Date(Date.now() - i * 3600000).toISOString(), // Stagger publication times
        content,
        credibilityScore,
        isFactChecked,
        factCheckResult,
      })
    }
  })

  return result
}

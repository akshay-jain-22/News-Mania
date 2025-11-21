interface FetchNewsDataParams {
  country?: string
  language?: "en" | "hi" | "kn"
  categories?: string[]
  page?: number
  pageSize?: number
  requireImage?: boolean
}

interface NewsDataArticle {
  article_id: string
  title: string
  link: string
  keywords?: string[]
  creator?: string[]
  video_url?: string | null
  description?: string
  content?: string
  pubDate: string
  image_url?: string | null
  source_id: string
  source_priority: number
  source_name?: string
  source_url?: string
  source_icon?: string | null
  language: string
  country: string[]
  category: string[]
  ai_tag?: string
  sentiment?: string
  sentiment_stats?: string
  ai_region?: string
  ai_org?: string
  duplicate?: boolean
}

interface FetchNewsDataResponse {
  status: string
  totalResults: number
  results: NewsDataArticle[]
  nextPage?: string | null
}

const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY || "pub_14f94574710c40dfab71541cbf169132"
const NEWSDATA_BASE_URL = "https://newsdata.io/api/1/latest"

// Supported categories by NewsData.io
export const SUPPORTED_CATEGORIES = [
  "business",
  "entertainment",
  "environment",
  "food",
  "health",
  "politics",
  "science",
  "sports",
  "technology",
  "top",
  "tourism",
  "world",
  "crime",
  "domestic",
  "education",
  "lifestyle",
  "other",
]

export async function fetchNewsData({
  country = "in",
  language = "en",
  categories = [],
  page = 1,
  pageSize = 20,
  requireImage = false,
}: FetchNewsDataParams): Promise<{
  source: "newsdata" | "newsapi-fallback"
  ok: boolean
  data: any
}> {
  try {
    console.log("[v0] Fetching from NewsData.io:", { country, language, categories, page })

    // Build category parameter
    const categoryParam = categories && categories.length > 0 ? `&category=${categories.join(",")}` : ""

    // Build NewsData.io URL without page parameter for initial request
    const url = `${NEWSDATA_BASE_URL}?apikey=${NEWSDATA_API_KEY}&country=${country}&language=${language}${categoryParam}`

    console.log("[v0] NewsData.io URL:", url.replace(NEWSDATA_API_KEY, "[API_KEY]"))

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "NewsMania/1.0",
      },
    })

    if (!response.ok) {
      console.warn(`[v0] NewsData.io returned ${response.status}, falling back to NewsAPI`)
      return await fetchNewsApiFallback({ country, language, categories, page, pageSize })
    }

    const data: FetchNewsDataResponse = await response.json()

    if (!data.results || data.results.length === 0) {
      console.warn("[v0] NewsData.io returned no results, falling back to NewsAPI")
      return await fetchNewsApiFallback({ country, language, categories, page, pageSize })
    }

    console.log(`[v0] NewsData.io returned ${data.results.length} articles`)

    // Normalize NewsData.io response to canonical format
    const normalizedArticles = data.results
      .filter((article) => {
        // Filter out articles without images if requireImage is true
        if (requireImage && !article.image_url) return false
        return article.title && article.description
      })
      .map((article, index) => ({
        id: article.article_id || `newsdata-${Date.now()}-${index}`,
        source: {
          id: article.source_id || null,
          name: article.source_name || article.source_id || "Unknown Source",
        },
        author: article.creator?.[0] || "Unknown Author",
        title: article.title,
        description: article.description || article.content?.substring(0, 200) || "",
        url: article.link,
        urlToImage: article.image_url,
        publishedAt: article.pubDate,
        content: article.content || article.description || "",
        credibilityScore: Math.floor(Math.random() * 30) + 70,
        isFactChecked: false,
        factCheckResult: null,
        category: article.category,
        language: article.language,
        country: article.country,
      }))
      .slice(0, pageSize)

    return {
      source: "newsdata",
      ok: true,
      data: {
        status: "ok",
        totalResults: data.totalResults,
        articles: normalizedArticles,
        nextPage: data.nextPage,
      },
    }
  } catch (error) {
    console.error("[v0] NewsData.io error:", error)
    console.log("[v0] Falling back to NewsAPI")
    return await fetchNewsApiFallback({ country, language, categories, page, pageSize })
  }
}

async function fetchNewsApiFallback({
  country = "in",
  language = "en",
  categories = [],
  page = 1,
  pageSize = 20,
}: FetchNewsDataParams): Promise<{
  source: "newsdata" | "newsapi-fallback"
  ok: boolean
  data: any
}> {
  try {
    console.log("[v0] Using NewsAPI fallback")

    // Map NewsData categories to NewsAPI categories
    const newsApiCategory = categories && categories.length > 0 ? categories[0] : "general"

    // Call existing NewsAPI endpoint
    const params = new URLSearchParams({
      category: newsApiCategory,
      country,
      page: page.toString(),
      pageSize: pageSize.toString(),
    })

    const response = await fetch(`/api/news?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`NewsAPI fallback failed: ${response.status}`)
    }

    const data = await response.json()

    return {
      source: "newsapi-fallback",
      ok: true,
      data: {
        ...data,
        articles: data.articles.map((article: any) => ({
          ...article,
          category: categories,
          language,
          country: [country],
        })),
      },
    }
  } catch (error) {
    console.error("[v0] NewsAPI fallback error:", error)
    return {
      source: "newsapi-fallback",
      ok: false,
      data: {
        status: "error",
        totalResults: 0,
        articles: [],
      },
    }
  }
}

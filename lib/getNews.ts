import { fetchNews } from "./news-api"

interface GetNewsParams {
  language: "English" | "Hindi" | "Kannada"
  country?: string
  category?: string
  pageSize?: number
  page?: number
}

const languageMap = {
  English: "en",
  Hindi: "hi",
  Kannada: "kn",
}

export async function getNews({ language, country = "in", category, pageSize = 20, page = 1 }: GetNewsParams) {
  const apiLang = languageMap[language] || "en"

  console.log(`[v0] Fetching news for language: ${language} (${apiLang})`)

  if (apiLang === "en") {
    console.log("[v0] Using NewsAPI for English content")
    return await fetchNews({
      category: category || "general",
      country: "us",
      pageSize,
      page,
    })
  }

  console.log(`[v0] Using NewsData.io API route for ${language} content`)

  try {
    // Build query parameters for the API route
    const params = new URLSearchParams({
      country,
      language: apiLang,
      page: page.toString(),
      pageSize: pageSize.toString(),
    })

    if (category) {
      params.append("category", category)
    }

    const response = await fetch(`/api/newsdata?${params.toString()}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.error(`[v0] NewsData API route error: ${response.status}`)
      throw new Error(`NewsData API route error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.articles || data.articles.length === 0) {
      console.warn("[v0] No results from NewsData API route")
      return []
    }

    console.log(`[v0] Fetched ${data.articles.length} articles from NewsData API route`)

    return data.articles
  } catch (error) {
    console.error("[v0] Error fetching from NewsData API route:", error)
    // Fallback to empty array on error
    return []
  }
}

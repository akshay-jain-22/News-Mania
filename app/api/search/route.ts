import { NextResponse } from "next/server"
import { fetchNews } from "@/lib/news-api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  const pageSize = searchParams.get("pageSize") || "20"
  const page = searchParams.get("page") || "1"

  if (!query) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 })
  }

  try {
    console.log(`API: Searching for "${query}"`)

    // Check if the query matches a category
    const categories = ["business", "technology", "sports", "health", "science", "entertainment", "politics", "general"]
    const lowerQuery = query.toLowerCase()

    if (categories.includes(lowerQuery)) {
      console.log(`API: Query "${query}" matches a category, fetching by category`)
      // If the query matches a category, fetch by category
      const articles = await fetchNews({
        category: lowerQuery,
        pageSize: Number(pageSize),
        page: Number(page),
        forceRefresh: true,
      })

      return NextResponse.json(articles)
    }

    // Otherwise, perform a regular search
    console.log(`API: Performing regular search for "${query}"`)
    const articles = await fetchNews({
      query: query,
      pageSize: Number(pageSize),
      page: Number(page),
      forceRefresh: true,
    })

    if (!articles || articles.length === 0) {
      console.log(`API: No results found for "${query}", fetching general news as fallback`)
      // If no articles found, return general news as fallback
      const generalArticles = await fetchNews({
        category: "general",
        pageSize: Number(pageSize),
        page: Number(page),
      })

      return NextResponse.json(generalArticles)
    }

    return NextResponse.json(articles)
  } catch (error) {
    console.error("API: Error searching news:", error)

    // Return mock data as fallback
    try {
      const fallbackArticles = await fetchNews({
        category: "general",
        pageSize: Number(pageSize),
        page: Number(page),
      })

      return NextResponse.json(fallbackArticles)
    } catch (fallbackError) {
      console.error("API: Even fallback failed:", fallbackError)
      return NextResponse.json({ error: "Failed to search news and fallback also failed" }, { status: 500 })
    }
  }
}

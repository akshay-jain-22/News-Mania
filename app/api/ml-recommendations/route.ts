import { type NextRequest, NextResponse } from "next/server"
import { mlPersonalizationEngine } from "@/lib/ml-personalization"
import { fetchNews } from "@/lib/news-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "10")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Fetch fresh articles from multiple categories
    const [techNews, businessNews, scienceNews, generalNews] = await Promise.all([
      fetchNews({ category: "technology", pageSize: 15 }),
      fetchNews({ category: "business", pageSize: 15 }),
      fetchNews({ category: "science", pageSize: 10 }),
      fetchNews({ category: "general", pageSize: 20 }),
    ])

    const allArticles = [...techNews, ...businessNews, ...scienceNews, ...generalNews]

    // Generate ML-powered recommendations
    const recommendations = await mlPersonalizationEngine.generateRecommendations(userId, allArticles, maxResults)

    // Generate personalized headlines for top recommendations
    const enhancedRecommendations = await Promise.all(
      recommendations.slice(0, 5).map(async (article) => ({
        ...article,
        personalizedHeadline: await mlPersonalizationEngine.generatePersonalizedHeadline(userId, article),
      })),
    )

    // Add regular recommendations without personalized headlines
    const finalRecommendations = [...enhancedRecommendations, ...recommendations.slice(5)]

    return NextResponse.json({
      recommendations: finalRecommendations,
      totalCount: finalRecommendations.length,
      userId,
    })
  } catch (error) {
    console.error("Error generating ML recommendations:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}

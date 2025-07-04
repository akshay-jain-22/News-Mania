import { type NextRequest, NextResponse } from "next/server"
import { recommendationEngine } from "@/lib/recommendation-engine"
import { fetchNews } from "@/lib/news-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "10")
    const categories = searchParams.get("categories")?.split(",")
    const excludeRead = searchParams.get("excludeRead") === "true"

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get recommendations from the engine
    const recommendations = await recommendationEngine.getRecommendations({
      userId,
      maxResults,
      categories,
      excludeReadArticles: excludeRead,
    })

    // If no personalized recommendations, get trending articles
    if (recommendations.length === 0) {
      const trendingArticles = await fetchNews({ pageSize: maxResults })
      const fallbackRecommendations = trendingArticles.map((article, index) => ({
        articleId: article.id,
        score: 0.8 - index * 0.05,
        reason: "Trending now",
        category: "general",
        confidence: 0.5,
      }))

      return NextResponse.json({
        recommendations: fallbackRecommendations,
        type: "trending",
        message: "Showing trending articles",
      })
    }

    return NextResponse.json({
      recommendations,
      type: "personalized",
      message: "Personalized recommendations",
    })
  } catch (error) {
    console.error("Error getting recommendations:", error)
    return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, action, articleId, timeSpent } = await request.json()

    if (!userId || !action || !articleId) {
      return NextResponse.json({ error: "userId, action, and articleId are required" }, { status: 400 })
    }

    // Update user profile based on interaction
    await recommendationEngine.updateUserProfile(userId, action, articleId, timeSpent)

    return NextResponse.json({
      success: true,
      message: "User profile updated",
    })
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
  }
}

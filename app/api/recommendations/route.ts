import { type NextRequest, NextResponse } from "next/server"
import { recommendationEngine } from "@/lib/recommendation-engine"

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

    const recommendations = await recommendationEngine.getRecommendations({
      userId,
      maxResults,
      categories,
      excludeReadArticles: excludeRead,
    })

    return NextResponse.json({
      recommendations,
      success: true,
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

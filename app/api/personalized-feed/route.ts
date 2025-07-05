import { type NextRequest, NextResponse } from "next/server"
import { fetchNews } from "@/lib/news-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get recommendations
    const recommendationsResponse = await fetch(`${request.nextUrl.origin}/api/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, maxResults: 15 }),
    })

    if (!recommendationsResponse.ok) {
      throw new Error("Failed to get recommendations")
    }

    const { recommendations, userProfile } = await recommendationsResponse.json()

    // Get fresh articles
    const allArticles = await fetchNews({ pageSize: 50, forceRefresh: true })

    // Match recommendations with articles
    const recommendedArticles = recommendations
      .map((rec: any) => {
        const article = allArticles.find((a) => a.id === rec.articleId)
        return article ? { ...article, ...rec } : null
      })
      .filter(Boolean)

    // Generate personalized message
    const messageResponse = await fetch(`${request.nextUrl.origin}/api/personalize-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topCategories: userProfile.preferredCategories,
        recommendationCount: recommendations.length,
        userInterests: userProfile.preferredCategories,
        timeOfDay: new Date().getHours(),
      }),
    })

    const { message } = messageResponse.ok
      ? await messageResponse.json()
      : { message: "Here are your personalized recommendations:" }

    return NextResponse.json({
      userId,
      recommendations,
      articles: recommendedArticles,
      personalizedMessage: message,
      lastUpdated: new Date().toISOString(),
      feedType: "personalized",
    })
  } catch (error) {
    console.error("Error generating personalized feed:", error)
    return NextResponse.json({ error: "Failed to generate personalized feed" }, { status: 500 })
  }
}

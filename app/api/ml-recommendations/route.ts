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
    const [generalNews, businessNews, techNews, healthNews, sportsNews] = await Promise.all([
      fetchNews({ category: "general", pageSize: 10, country: "us" }),
      fetchNews({ category: "business", pageSize: 8, country: "us" }),
      fetchNews({ category: "technology", pageSize: 8, country: "us" }),
      fetchNews({ category: "health", pageSize: 6, country: "us" }),
      fetchNews({ category: "sports", pageSize: 6, country: "us" }),
    ])

    const allArticles = [...generalNews, ...businessNews, ...techNews, ...healthNews, ...sportsNews]

    // Generate ML recommendations
    const recommendationScores = mlPersonalizationEngine.generateRecommendations(userId, allArticles, maxResults)

    // Get the actual articles with their scores
    const recommendations = recommendationScores
      .map((score) => {
        const article = allArticles.find((a) => a.id === score.articleId)
        return {
          ...article,
          recommendationScore: score.score,
          recommendationReasons: score.reasons,
        }
      })
      .filter(Boolean)

    // Enhance headlines with personalization (optional)
    const enhancedRecommendations = await Promise.all(
      recommendations.map(async (article) => {
        try {
          // Try to personalize headline using AI
          const response = await fetch(`${request.nextUrl.origin}/api/personalize-headline`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              originalHeadline: article.title,
              userInterests: ["technology", "business"], // This would come from user profile
            }),
          })

          if (response.ok) {
            const data = await response.json()
            return {
              ...article,
              personalizedHeadline: data.personalizedHeadline,
            }
          }
        } catch (error) {
          console.error("Error personalizing headline:", error)
        }
        return article
      }),
    )

    return NextResponse.json({
      recommendations: enhancedRecommendations,
      totalCount: enhancedRecommendations.length,
    })
  } catch (error) {
    console.error("Error generating ML recommendations:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}

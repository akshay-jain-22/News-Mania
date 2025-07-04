import { type NextRequest, NextResponse } from "next/server"
import { recommendationEngine } from "@/lib/recommendation-engine"
import { fetchNews } from "@/lib/news-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Generate personalized feed
    const personalizedFeed = await recommendationEngine.generatePersonalizedFeed(userId)

    // Get actual articles for the recommendations
    const articlePromises = personalizedFeed.recommendations.map(async (rec) => {
      // In a real app, you'd fetch from your database
      // For now, we'll use a placeholder
      return {
        id: rec.articleId,
        title: `Article ${rec.articleId}`,
        description: `Recommended article in ${rec.category}`,
        score: rec.score,
        reason: rec.reason,
        personalizedHeadline: rec.personalizedHeadline,
        category: rec.category,
        confidence: rec.confidence,
      }
    })

    const articles = await Promise.all(articlePromises)

    return NextResponse.json({
      ...personalizedFeed,
      articles,
      success: true,
    })
  } catch (error) {
    console.error("Error generating personalized feed:", error)

    // Fallback to regular news feed
    try {
      const fallbackArticles = await fetchNews({ pageSize: 10 })
      return NextResponse.json({
        userId: request.nextUrl.searchParams.get("userId"),
        recommendations: fallbackArticles.map((article, index) => ({
          articleId: article.id,
          score: 0.8 - index * 0.05,
          reason: "Trending now",
          category: "general",
          confidence: 0.5,
        })),
        personalizedMessage: "Here are today's top stories:",
        lastUpdated: new Date().toISOString(),
        feedType: "trending" as const,
        articles: fallbackArticles,
        success: true,
        fallback: true,
      })
    } catch (fallbackError) {
      return NextResponse.json({ error: "Failed to generate feed" }, { status: 500 })
    }
  }
}

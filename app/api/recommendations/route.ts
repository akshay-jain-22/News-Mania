import { fetchNews } from "@/lib/news-api"
import { recommendationPipeline } from "@/lib/system-architecture/recommendation-pipeline"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const category = searchParams.get("category")

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 })
    }

    // Fetch articles
    const articles = await fetchNews(category)

    // Generate recommendations
    const result = await recommendationPipeline.generateRecommendations(userId, articles, limit)

    // Map back to full articles
    const recommendedArticles = result.recommendations
      .map((rec) => articles.find((a) => a.id === rec.articleId))
      .filter(Boolean)

    return Response.json({
      success: true,
      recommendations: recommendedArticles,
      metadata: {
        pipeline: result.pipeline,
        confidence: result.confidence,
        count: recommendedArticles.length,
      },
    })
  } catch (error) {
    console.error("Error generating recommendations:", error)
    return Response.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}

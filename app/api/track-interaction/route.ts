import { recommendationPipeline } from "@/lib/system-architecture/recommendation-pipeline"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, articleId, action } = body

    if (!userId || !articleId) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Track the interaction
    recommendationPipeline.trackReading(userId, articleId)

    return Response.json({
      success: true,
      message: "Interaction tracked",
    })
  } catch (error) {
    console.error("Error tracking interaction:", error)
    return Response.json({ error: "Failed to track interaction" }, { status: 500 })
  }
}

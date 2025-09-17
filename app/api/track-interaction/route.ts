import { type NextRequest, NextResponse } from "next/server"
import { recommendationPipeline } from "@/lib/system-architecture/recommendation-pipeline"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, article_id, action, read_duration, scroll_depth, device_type, source } = body

    if (!user_id || !article_id || !action) {
      return NextResponse.json(
        {
          error: "Missing required fields: user_id, article_id, action",
        },
        { status: 400 },
      )
    }

    console.log(`📊 Tracking interaction: ${action} on ${article_id} by ${user_id}`)

    await recommendationPipeline.trackInteraction({
      user_id,
      article_id,
      action,
      read_duration,
      scroll_depth,
      device_type,
      source,
    })

    return NextResponse.json({
      success: true,
      message: "Interaction tracked successfully",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error tracking interaction:", error)
    return NextResponse.json(
      {
        error: "Failed to track interaction",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

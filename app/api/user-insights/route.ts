import { type NextRequest, NextResponse } from "next/server"
import { recommendationPipeline } from "@/lib/system-architecture/recommendation-pipeline"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log(`📈 Generating insights for user: ${userId}`)

    const insights = await recommendationPipeline.getUserInsights(userId)

    return NextResponse.json({
      success: true,
      insights,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error generating user insights:", error)
    return NextResponse.json(
      {
        error: "Failed to generate insights",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

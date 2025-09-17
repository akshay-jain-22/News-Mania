import { type NextRequest, NextResponse } from "next/server"
import { recommendationPipeline } from "@/lib/system-architecture/recommendation-pipeline"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const excludeSeen = searchParams.get("excludeSeen") === "true"
    const categories = searchParams.get("categories")?.split(",")
    const locationFilter = searchParams.get("locationFilter") === "true"
    const diversityBoost = searchParams.get("diversityBoost")
      ? Number.parseFloat(searchParams.get("diversityBoost")!)
      : undefined

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log(`🤖 Generating recommendations for user: ${userId}`)

    const result = await recommendationPipeline.generateRecommendations({
      user_id: userId,
      limit,
      exclude_seen: excludeSeen,
      time_context: "current",
      categories,
      location_filter: locationFilter,
      diversity_boost: diversityBoost,
    })

    return NextResponse.json({
      success: true,
      recommendations: result.recommendations,
      metadata: result.metadata,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error generating recommendations:", error)
    return NextResponse.json(
      {
        error: "Failed to generate recommendations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, limit = 20, exclude_seen = true, categories, location_filter = false, diversity_boost } = body

    if (!user_id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const result = await recommendationPipeline.generateRecommendations({
      user_id,
      limit,
      exclude_seen,
      time_context: "current",
      categories,
      location_filter,
      diversity_boost,
    })

    return NextResponse.json({
      success: true,
      recommendations: result.recommendations,
      metadata: result.metadata,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error generating recommendations:", error)
    return NextResponse.json(
      {
        error: "Failed to generate recommendations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

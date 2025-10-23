import { type NextRequest, NextResponse } from "next/server"
import { recommendationEngine } from "@/lib/recommendation-engine"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const personalizedFeed = await recommendationEngine.generatePersonalizedFeed(userId)

    return NextResponse.json(personalizedFeed)
  } catch (error) {
    console.error("Personalized feed API error:", error)
    return NextResponse.json({ error: "Failed to generate personalized feed" }, { status: 500 })
  }
}

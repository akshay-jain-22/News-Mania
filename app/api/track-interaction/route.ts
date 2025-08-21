import { type NextRequest, NextResponse } from "next/server"
import { mlPersonalizationEngine } from "@/lib/ml-personalization"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, articleId, interactionType, timeSpent, scrollDepth } = body

    if (!userId || !articleId || !interactionType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await mlPersonalizationEngine.trackInteraction(userId, articleId, interactionType, timeSpent, scrollDepth)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking interaction:", error)
    return NextResponse.json({ error: "Failed to track interaction" }, { status: 500 })
  }
}

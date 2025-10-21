import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, articleId, interactionType, timeSpent, scrollDepth } = await request.json()

    if (!userId || !articleId || !interactionType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Log the interaction (in a real app, this would go to a database)
    console.log(`📊 User ${userId} performed ${interactionType} on article ${articleId}`, {
      timeSpent,
      scrollDepth,
      timestamp: new Date().toISOString(),
    })

    // Simulate successful tracking
    return NextResponse.json({
      success: true,
      userId,
      articleId,
      interactionType,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error tracking interaction:", error)
    return NextResponse.json({ error: "Failed to track interaction" }, { status: 500 })
  }
}

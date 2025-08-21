import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Generate sample user insights without external dependencies
    const insights = generateSampleInsights(userId)

    return NextResponse.json(insights)
  } catch (error) {
    console.error("Error generating user insights:", error)
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 500 })
  }
}

function generateSampleInsights(userId: string) {
  // Generate realistic sample data based on user ID
  const userHash = simpleHash(userId)
  const baseInteractions = 15 + (Math.abs(userHash) % 50)
  const baseEngagement = 60 + (Math.abs(userHash) % 35)

  return {
    userId,
    totalInteractions: baseInteractions,
    recentInteractions: Math.floor(baseInteractions * 0.3),
    engagementScore: baseEngagement,
    topCategories: [
      ["technology", 0.8],
      ["business", 0.6],
      ["science", 0.4],
      ["health", 0.3],
      ["sports", 0.2],
    ],
    readingPatterns: {
      averageReadTime: 30 + (Math.abs(userHash) % 60),
      peakHours: [9, 14, 20],
      consistency: 70 + (Math.abs(userHash) % 25),
      preferredTimeSlot: "morning",
    },
    lastActive: new Date(),
    generatedAt: new Date().toISOString(),
  }
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash
}

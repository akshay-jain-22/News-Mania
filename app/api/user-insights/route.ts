import { type NextRequest, NextResponse } from "next/server"
import { mlPersonalizationEngine } from "@/lib/ml-personalization"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const insights = mlPersonalizationEngine.getUserInsights(userId)

    return NextResponse.json(insights)
  } catch (error) {
    console.error("Error getting user insights:", error)
    return NextResponse.json({ error: "Failed to get user insights" }, { status: 500 })
  }
}

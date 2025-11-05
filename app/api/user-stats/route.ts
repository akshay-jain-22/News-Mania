import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/auth-utils"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request)
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: userStats, error: statsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", auth.userId)
      .single()

    if (statsError && statsError.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is expected for new users
      throw statsError
    }

    if (userStats) {
      return NextResponse.json({
        articlesRead: userStats.articles_read || 0,
        timeSpent: formatSeconds(userStats.time_spent_seconds || 0),
        readingStreak: userStats.reading_streak || 0,
        topCategory: userStats.top_category || "Technology",
        categoryBreakdown: userStats.category_breakdown || {},
      })
    }

    // Return default stats for new users
    return NextResponse.json({
      articlesRead: 0,
      timeSpent: "0h 0m",
      readingStreak: 0,
      topCategory: "Technology",
      categoryBreakdown: {},
    })
  } catch (error) {
    console.error("Failed to fetch user stats:", error)
    return NextResponse.json({ error: "Failed to fetch user stats" }, { status: 500 })
  }
}

function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

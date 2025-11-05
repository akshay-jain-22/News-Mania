import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { verifyServiceRole } from "@/lib/auth-utils"

export async function POST(request: NextRequest) {
  try {
    // Verify this is a valid internal request
    const auth = await verifyServiceRole()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Fetch all interactions for this user
    const { data: interactions, error: interactionsError } = await supabase
      .from("interactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (interactionsError) throw interactionsError

    if (!interactions || interactions.length === 0) {
      // Upsert default stats for users with no interactions
      await supabase.from("user_stats").upsert({
        user_id: userId,
        articles_read: 0,
        time_spent_seconds: 0,
        reading_streak: 0,
        top_category: "Technology",
        updated_at: new Date().toISOString(),
      })

      return NextResponse.json({ success: true, articlesRead: 0 })
    }

    // Calculate stats
    const readCompleteActions = interactions.filter((i) => i.action === "read_complete" || i.action === "read")
    const articlesRead = readCompleteActions.length
    const totalTimeSpent = readCompleteActions.reduce((sum, i) => sum + (i.duration_seconds || 0), 0)

    // Calculate reading streak (consecutive days)
    const readingStreak = calculateReadingStreak(interactions)

    // Calculate top category from article metadata
    const topCategory = await calculateTopCategory(supabase, interactions)

    // Fetch article metadata for category breakdown
    const categoryBreakdown = await calculateCategoryBreakdown(supabase, interactions)

    // Upsert stats into user_stats table
    const { error: upsertError } = await supabase.from("user_stats").upsert({
      user_id: userId,
      articles_read: articlesRead,
      time_spent_seconds: totalTimeSpent,
      reading_streak: readingStreak,
      top_category: topCategory,
      category_breakdown: categoryBreakdown,
      last_read_date: new Date().toISOString().split("T")[0],
      updated_at: new Date().toISOString(),
    })

    if (upsertError) throw upsertError

    return NextResponse.json({
      success: true,
      articlesRead,
      timeSpent: formatSeconds(totalTimeSpent),
      readingStreak,
      topCategory,
    })
  } catch (error) {
    console.error("Failed to calculate user stats:", error)
    return NextResponse.json({ error: "Failed to calculate user stats" }, { status: 500 })
  }
}

function formatSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

function calculateReadingStreak(interactions: any[]): number {
  if (!interactions.length) return 0

  const readDates = new Set<string>()
  interactions.forEach((i) => {
    const date = new Date(i.created_at).toISOString().split("T")[0]
    if (i.action === "read_complete" || i.action === "read") {
      readDates.add(date)
    }
  })

  if (readDates.size === 0) return 0

  const sortedDates = Array.from(readDates).sort().reverse()
  let streak = 1
  const today = new Date().toISOString().split("T")[0]

  // Check if the most recent read is today or yesterday
  const lastReadDate = sortedDates[0]
  const diffDays = (new Date(today).getTime() - new Date(lastReadDate).getTime()) / (1000 * 60 * 60 * 24)

  if (diffDays > 1) return 0

  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = new Date(sortedDates[i])
    const next = new Date(sortedDates[i + 1])
    const dayDiff = (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24)

    if (dayDiff === 1) {
      streak++
    } else {
      break
    }
  }

  return streak
}

async function calculateTopCategory(supabase: any, interactions: any[]): Promise<string> {
  const categoryCount: Record<string, number> = {}

  for (const interaction of interactions) {
    if (!interaction.article_id) continue

    const { data: metadata } = await supabase
      .from("article_metadata")
      .select("tags")
      .eq("article_id", interaction.article_id)
      .single()

    if (metadata?.tags && Array.isArray(metadata.tags)) {
      metadata.tags.forEach((tag: string) => {
        categoryCount[tag] = (categoryCount[tag] || 0) + 1
      })
    }
  }

  let topCategory = "Technology"
  let maxCount = 0

  Object.entries(categoryCount).forEach(([category, count]) => {
    if (count > maxCount) {
      maxCount = count
      topCategory = category
    }
  })

  return topCategory
}

async function calculateCategoryBreakdown(supabase: any, interactions: any[]): Promise<Record<string, number>> {
  const breakdown: Record<string, number> = {}

  for (const interaction of interactions) {
    if (!interaction.article_id) continue

    const { data: metadata } = await supabase
      .from("article_metadata")
      .select("tags")
      .eq("article_id", interaction.article_id)
      .single()

    if (metadata?.tags && Array.isArray(metadata.tags)) {
      metadata.tags.forEach((tag: string) => {
        breakdown[tag] = (breakdown[tag] || 0) + 1
      })
    }
  }

  return breakdown
}

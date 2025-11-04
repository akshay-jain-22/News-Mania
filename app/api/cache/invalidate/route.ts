import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase"

const invalidateSchema = z.object({
  articleId: z.string().optional(),
  type: z.enum(["summarize", "qa", "recommendations"]).optional(),
  userId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Verify admin or service auth
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CACHE_INVALIDATION_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { articleId, type, userId } = invalidateSchema.parse(body)

    const supabase = createServerSupabaseClient()

    if ((!type || type === "summarize") && articleId) {
      await supabase.from("summarization_cache").delete().eq("article_id", articleId)
    }

    if ((!type || type === "qa") && articleId) {
      await supabase.from("qa_cache").delete().eq("article_id", articleId)
    }

    if (!type || type === "recommendations") {
      if (userId) {
        await supabase.from("recommendations_cache").delete().eq("user_id", userId)
      } else {
        // Invalidate all recommendations
        await supabase.from("recommendations_cache").delete().lt("expires_at", new Date().toISOString())
      }
    }

    return NextResponse.json({ success: true, message: "Cache invalidated" }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("Cache invalidation error:", error)
    return NextResponse.json({ error: "Failed to invalidate cache" }, { status: 500 })
  }
}

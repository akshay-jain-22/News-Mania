import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase"
import { checkRateLimit } from "@/lib/auth-utils"

const invalidateSchema = z.object({
  userId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = invalidateSchema.parse(body)

    // Rate limiting
    if (!checkRateLimit(`invalidate:${userId}`, 50, 60000)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const supabase = createServerSupabaseClient()

    // Delete cached recommendations for user
    const { error } = await supabase.from("recommendations_cache").delete().eq("user_id", userId)

    if (error) {
      console.error("[v0] Error invalidating cache:", error)
      return NextResponse.json({ error: "Failed to invalidate cache" }, { status: 500 })
    }

    console.log(`[v0] Invalidated cache for userId=${userId}`)

    return NextResponse.json({ success: true, message: "Cache invalidated" }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("[v0] Invalidate cache error:", error)
    return NextResponse.json({ error: "Failed to invalidate cache" }, { status: 500 })
  }
}

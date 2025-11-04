import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { verifyAuthToken } from "@/lib/auth-utils"
import { createServerSupabaseClient } from "@/lib/supabase"

const trackSchema = z.object({
  articleId: z.string().min(1),
  action: z.enum(["view", "read_complete", "save", "share", "summarize", "qa"]),
  durationSeconds: z.number().optional(),
  question: z.string().optional(),
  resultRequestId: z.string().optional(),
  modelUsed: z.string().optional(),
  providerUsed: z.string().optional(),
  tokensUsed: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request)
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const data = trackSchema.parse(body)

    const supabase = createServerSupabaseClient()

    await supabase.from("interactions").insert({
      user_id: auth.userId,
      article_id: data.articleId,
      action: data.action,
      duration_seconds: data.durationSeconds,
      question: data.question,
      request_id: data.resultRequestId,
      model_used: data.modelUsed,
      provider_used: data.providerUsed,
      tokens_used: data.tokensUsed,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("Interaction tracking error:", error)
    return NextResponse.json({ error: "Failed to track interaction" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { sessionId, anonId, userId, direction, text, intent, latency, provider } =
      await request.json()

    const { error } = await supabase.from("assistant_logs").insert({
      session_id: sessionId,
      anon_id: anonId,
      user_id: userId || null,
      direction,
      text,
      provider: provider || "gemini",
      intent: intent || null,
      latency_ms: latency || null,
      is_anonymous: !userId,
    })

    if (error) {
      if (error.message?.includes("not found") || error.code === "42P01") {
        console.log("[Log] Tables not yet created - conversation will work without logging")
        return NextResponse.json({ success: true, warning: "Logging disabled" })
      }
      
      console.error("[Log] Insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Log] Error:", error)
    return NextResponse.json({ success: true, warning: "Logging unavailable" })
  }
}

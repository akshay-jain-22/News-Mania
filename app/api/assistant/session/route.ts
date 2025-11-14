import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { sessionId, anonId, userId, contextType, contextId, mode } = await request.json()

    try {
      const { data, error } = await supabase.from("assistant_sessions").insert({
        session_id: sessionId,
        anon_id: anonId,
        user_id: userId || null,
        context_type: contextType || "general",
        context_id: contextId || null,
        mode: mode || "push_to_talk",
        active: true,
      })

      if (error) {
        console.log("[Session] Table not ready:", error.message)
        return NextResponse.json({ success: true })
      }

      return NextResponse.json({ success: true })
    } catch (dbError: any) {
      console.log("[Session] Database unavailable")
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.log("[Session] Error:", error)
    return NextResponse.json({ success: true })
  }
}

export async function PATCH(request: Request) {
  try {
    const { sessionId, mode, active } = await request.json()

    const updateData: any = { last_active_at: new Date().toISOString() }
    if (mode) updateData.mode = mode
    if (typeof active === "boolean") updateData.active = active

    try {
      const { error } = await supabase
        .from("assistant_sessions")
        .update(updateData)
        .eq("session_id", sessionId)

      if (error) {
        console.log("[Session] Update error:", error.message)
        return NextResponse.json({ success: true })
      }

      return NextResponse.json({ success: true })
    } catch (dbError: any) {
      console.log("[Session] Database unavailable")
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.log("[Session] Error:", error)
    return NextResponse.json({ success: true })
  }
}

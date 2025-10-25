import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const requestId = request.nextUrl.searchParams.get("requestId")

    if (!requestId) {
      return NextResponse.json({ error: "requestId parameter is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const { data: summarizeData } = await supabase
      .from("summarization_cache")
      .select("*")
      .eq("request_id", requestId)
      .single()

    if (summarizeData) {
      return NextResponse.json(
        {
          status: "completed",
          type: "summarize",
          result: {
            summary: summarizeData.summary,
            sources: summarizeData.sources,
          },
        },
        { status: 200 },
      )
    }

    const { data: qaData } = await supabase.from("qa_cache").select("*").eq("request_id", requestId).single()

    if (qaData) {
      return NextResponse.json(
        {
          status: "completed",
          type: "qa",
          result: {
            answer: qaData.answer,
            sources: qaData.sources,
          },
        },
        { status: 200 },
      )
    }

    return NextResponse.json({ status: "pending" }, { status: 202 })
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

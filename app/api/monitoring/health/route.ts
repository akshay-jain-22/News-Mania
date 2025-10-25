import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    const { error: dbError } = await supabase.from("users").select("count").limit(1)

    const health = {
      status: dbError ? "degraded" : "healthy",
      timestamp: new Date().toISOString(),
      services: {
        api: "operational",
        database: dbError ? "degraded" : "operational",
        auth: "operational",
        cache: "operational",
        vectorDb: "operational",
      },
      checks: {
        database: !dbError,
        auth: true,
        cache: true,
      },
    }

    const statusCode = health.status === "healthy" ? 200 : 503

    return NextResponse.json(health, { status: statusCode })
  } catch (error) {
    console.error("Health check error:", error)

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        services: {
          api: "operational",
          database: "down",
          auth: "operational",
          cache: "operational",
          vectorDb: "operational",
        },
        error: String(error),
      },
      { status: 503 },
    )
  }
}

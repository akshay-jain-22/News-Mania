import { NextResponse } from "next/server"
import { setupNewsRefresh } from "@/lib/news-api"

// This endpoint will be called by a cron job to refresh the news cache
export async function GET() {
  try {
    await setupNewsRefresh()
    return NextResponse.json({ success: true, message: "News cache refreshed successfully" })
  } catch (error) {
    console.error("Error refreshing news cache:", error)
    return NextResponse.json({ error: "Failed to refresh news cache" }, { status: 500 })
  }
}

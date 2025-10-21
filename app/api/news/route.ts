import { fetchNews } from "@/lib/news-api"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category") || undefined

    const articles = await fetchNews(category || undefined)

    return NextResponse.json({
      success: true,
      articles,
    })
  } catch (error) {
    console.error("Error in news API:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch news" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { fetchNews } from "@/lib/news-api"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    const articles = await fetchNews(category || undefined)
    return NextResponse.json(articles)
  } catch (error) {
    console.error("Error in API route:", error)
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 })
  }
}

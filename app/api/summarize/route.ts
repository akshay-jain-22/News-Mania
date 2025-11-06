import { NextResponse } from "next/server"
import { summarizeArticle } from "@/lib/gemini-client"

// Cache for summaries to ensure consistency but allow variation
const summaryCache = new Map<string, { summary: string; timestamp: number; variations: string[] }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export async function POST(request: Request) {
  try {
    const { articleId, title, description, content, style = "concise" } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        {
          summary: "Unable to summarize without article content. Please provide a valid article.",
        },
        { status: 400 },
      )
    }

    try {
      console.log("Generating summary for article:", articleId || title)

      // Check cache for existing summary
      const cached = summaryCache.get(articleId || title)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        const variation = cached.variations[Math.floor(Math.random() * cached.variations.length)]
        return NextResponse.json({
          summary: variation || cached.summary,
          cached: true,
          articleId,
        })
      }

      const summaryText = await summarizeArticle(title, content, style)

      console.log("Successfully generated summary with Gemini")

      // Generate variations
      const variations = [summaryText]
      if (articleId) {
        try {
          const altStyle = style === "concise" ? "detailed" : "concise"
          const variation1 = await summarizeArticle(title, content, altStyle)
          if (variation1) variations.push(variation1)
        } catch (error) {
          console.error("Error generating variation:", error)
        }
      }

      // Cache the summary and variations
      if (articleId) {
        summaryCache.set(articleId, {
          summary: summaryText,
          timestamp: Date.now(),
          variations,
        })
      }

      if (!summaryText || summaryText.trim() === "") {
        return NextResponse.json({
          summary: `This article titled "${title}" covers important news.`,
          articleId,
        })
      }

      return NextResponse.json({
        summary: summaryText,
        articleId,
        style,
        variations: variations.length > 1 ? variations.slice(1) : [],
      })
    } catch (error) {
      console.error("Gemini generation error:", error)
      return NextResponse.json({
        summary: `This article titled "${title}" discusses ${description?.substring(0, 50) || "current events"}.`,
        articleId,
        error: "Failed to generate summary",
      })
    }
  } catch (error) {
    console.error("General error in summarize API route:", error)
    return NextResponse.json(
      {
        summary: "We encountered a technical issue while summarizing this article. Please try again.",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const articleId = searchParams.get("articleId")

  if (!articleId) {
    return NextResponse.json({ error: "Article ID is required" }, { status: 400 })
  }

  const cached = summaryCache.get(articleId)
  if (cached) {
    return NextResponse.json({
      summary: cached.summary,
      cached: true,
      variations: cached.variations,
    })
  }

  return NextResponse.json({ error: "No cached summary found" }, { status: 404 })
}

import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { checkRateLimit } from "@/lib/auth-utils"
import { logger } from "@/lib/logger"
import fallbackNewsData from "@/data/fallback-news.json"
import { llmService } from "@/lib/llm-service" // Declare llmService variable

const personalizeSchema = z.object({
  userId: z.string().min(1),
  limit: z.number().int().min(1).max(50).default(20),
})

interface PersonalizedItem {
  articleId: string
  title: string
  score: number
  reason: string
  category: string
  thumb: string
  source: string
  publishAt: string
  credibility: number
}

interface PersonalizeResponse {
  items: PersonalizedItem[]
  source: "personalized" | "fallback"
  fallbackBuckets?: string[]
  totalCount: number
}

async function generateLLMReason(
  userId: string,
  articleTitle: string,
  userInteractionSummary: string,
): Promise<string> {
  try {
    const prompt = `Given a user's recent reading activity and an article title, provide a short, personalized reason (max 10 words) why this article might interest them. 

User activity: ${userInteractionSummary}
Article: "${articleTitle}"

Respond with ONLY the reason, nothing else. Example: "Matches your interest in climate policy"`

    const response = await llmService.generate(prompt, "gpt-4o", {
      temperature: 0.7,
      maxTokens: 50,
    })

    console.log(`[v0] LLM reason generated (provider=${response.modelUsed}):`, response.text)
    return response.text.trim()
  } catch (error) {
    console.log("[v0] LLM reason generation failed, using fallback:", error)
    return "Recommended for you"
  }
}

async function calculatePersonalizationScore(
  userId: string,
  article: any,
  interactions: any[],
  supabase: any,
  userActivitySummary: string,
): Promise<{ score: number; reason: string }> {
  // Collaborative score: articles similar to ones user engaged with
  const userEngagedArticles = interactions.filter((i) => {
    const actionType = (i.action || i.type || "").toLowerCase()
    return ["read_complete", "save", "note"].includes(actionType)
  })
  const collaborativeScore = Math.min(userEngagedArticles.length / 10, 1.0) * 0.35

  // Content similarity: article category/topic matches user interests
  const userCategories = interactions
    .filter((i) => i.article_metadata?.category || i.tags?.[0])
    .map((i) => (i.article_metadata?.category || i.tags?.[0] || "").toLowerCase())
  const articleCategory = (((article.category || article.tags?.[0]) as string) || "").toLowerCase()
  const categoryMatch = userCategories.includes(articleCategory) ? 0.4 : 0.1

  // Behavior boost: recency decay on read actions
  const recentReads = interactions
    .filter((i) => {
      const actionType = (i.action || i.type || "").toLowerCase()
      return actionType === "read_complete"
    })
    .filter((i) => {
      const createdAt = i.created_at || new Date().toISOString()
      const timeDiff = Date.now() - new Date(createdAt).getTime()
      return timeDiff < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    })
  const behaviorBoost = Math.min(recentReads.length / 5, 1.0) * 0.15

  // Freshness: recent articles boost
  const publishedAt = article.published_at || article.created_at || new Date().toISOString()
  const publishedDaysAgo = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24)
  const freshnessScore = Math.max(1 - publishedDaysAgo / 30, 0) * 0.1

  const score = collaborativeScore + categoryMatch + behaviorBoost + freshnessScore

  let reason = "Based on your reading history"
  if (score > 0.3) {
    reason = await generateLLMReason(userId, article.title || article.summary || "Article", userActivitySummary)
  }

  return { score, reason }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { userId, limit } = personalizeSchema.parse(body)

    // Rate limiting per userId
    if (!checkRateLimit(`personalize:${userId}`, 10, 60000)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 10 personalized requests per minute." },
        { status: 429 },
      )
    }

    // This ensures the endpoint always returns data even if Supabase tables don't exist yet
    console.log(`[v0] Using bundled fallback feed for userId=${userId}`)

    const personalizedItems: PersonalizedItem[] = fallbackNewsData.slice(0, limit).map((item: any) => ({
      articleId: item.id,
      title: item.title,
      score: 0.75,
      reason: "Top picks curated just for you",
      category: item.category.toLowerCase(),
      thumb: item.thumb_url || "",
      source: item.source,
      publishAt: item.created_at,
      credibility: item.credibility_score || 0.85,
    }))

    const response: PersonalizeResponse = {
      items: personalizedItems,
      source: "fallback",
      fallbackBuckets: ["top-news", "business", "tech", "sports", "world", "health"],
      totalCount: personalizedItems.length,
    }

    logger.log({
      level: "info",
      requestId: `req-${Date.now()}`,
      userId,
      endpoint: "/api/ml/personalize",
      message: "Fallback feed generated",
      metadata: {
        duration_ms: Date.now() - startTime,
        provider_used: "fallback",
        items_count: personalizedItems.length,
      },
    })

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("[v0] Personalize error:", error)
    logger.log({
      level: "error",
      requestId: `req-${Date.now()}`,
      endpoint: "/api/ml/personalize",
      message: "Personalize endpoint error",
      metadata: { error: String(error) },
    })

    // Final fallback: return bundled JSON with generic reason
    return NextResponse.json(
      {
        items: fallbackNewsData.slice(0, 20).map((item: any) => ({
          articleId: item.id,
          title: item.title,
          score: 0.7,
          reason: "Top picks curated just for you",
          category: item.category.toLowerCase(),
          thumb: item.thumb_url || "",
          source: item.source,
          publishAt: item.created_at,
          credibility: item.credibility_score || 0.85,
        })),
        source: "fallback",
        fallbackBuckets: ["top-news", "business", "tech", "sports", "world", "health"],
        totalCount: fallbackNewsData.length,
      },
      { status: 200 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase"
import { checkRateLimit } from "@/lib/auth-utils"
import { logger } from "@/lib/logger"
import { llmService } from "@/lib/llm-service"

const personalizeSchema = z.object({
  userId: z.string().min(1),
  limit: z.number().default(20).max(50),
  context: z.string().optional(),
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

// Calculate personalization score combining collaborative, content, and behavior signals
async function calculatePersonalizationScore(
  userId: string,
  article: any,
  interactions: any[],
  supabase: any,
  userActivitySummary: string,
): Promise<{ score: number; reason: string }> {
  // Collaborative score: articles similar to ones user engaged with
  const userEngagedArticles = interactions.filter((i) => ["read_complete", "save", "note"].includes(i.type))
  const collaborativeScore = Math.min(userEngagedArticles.length / 10, 1.0) * 0.35

  // Content similarity: article category/topic matches user interests
  const userCategories = interactions
    .filter((i) => i.article_metadata?.category)
    .map((i) => i.article_metadata.category)
  const categoryMatch = userCategories.includes(article.category) ? 0.4 : 0.1

  // Behavior boost: recency decay on read actions
  const recentReads = interactions
    .filter((i) => i.type === "read_complete")
    .filter((i) => {
      const timeDiff = Date.now() - new Date(i.created_at).getTime()
      return timeDiff < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    })
  const behaviorBoost = Math.min(recentReads.length / 5, 1.0) * 0.15

  // Freshness: recent articles boost
  const publishedDaysAgo = (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60 * 24)
  const freshnessScore = Math.max(1 - publishedDaysAgo / 30, 0) * 0.1

  const score = collaborativeScore + categoryMatch + behaviorBoost + freshnessScore

  let reason = "Based on your reading history"
  if (score > 0.3) {
    reason = await generateLLMReason(userId, article.summary || "Article", userActivitySummary)
  }

  return { score, reason }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const body = await request.json()
    const { userId, limit, context } = personalizeSchema.parse(body)

    // Rate limiting per userId
    if (!checkRateLimit(`personalize:${userId}`, 10, 60000)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 10 personalized requests per minute." },
        { status: 429 },
      )
    }

    const supabase = createServerSupabaseClient()

    const { data: interactions } = await supabase
      .from("interactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50)

    // Build summary of user activity for LLM context
    const activityTypes = interactions?.map((i) => i.type) || []
    const uniqueCategories = [...new Set((interactions || []).map((i) => i.category || "general"))]
    const userActivitySummary = `Recently read about ${uniqueCategories.slice(0, 3).join(", ")}. Activity: ${activityTypes.slice(0, 5).join(", ")}.`

    if (interactions && interactions.length > 0) {
      console.log(`[v0] Computing personalization with LLM for userId=${userId}`)

      // Fetch candidate articles
      const { data: articles } = await supabase
        .from("article_metadata")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)

      if (articles && articles.length > 0) {
        // Score each article
        const scored = await Promise.all(
          articles.map(async (article) => {
            const { score, reason } = await calculatePersonalizationScore(
              userId,
              article,
              interactions,
              supabase,
              userActivitySummary,
            )
            return {
              ...article,
              personalizedScore: score,
              personalizedReason: reason,
            }
          }),
        )

        // Sort by personalized score and take top N
        const topItems = scored
          .sort((a, b) => b.personalizedScore - a.personalizedScore)
          .slice(0, limit)
          .filter((a) => a.personalizedScore > 0)

        if (topItems.length > 0) {
          const response: PersonalizeResponse = {
            items: topItems.map((item) => ({
              articleId: item.article_id,
              title: item.summary || "Article",
              score: item.personalizedScore,
              reason: item.personalizedReason,
              category: item.tags?.[0] || "general",
              thumb: "",
              source: "NewsAPI",
              publishAt: item.created_at,
              credibility: 85,
            })),
            source: "personalized",
            totalCount: topItems.length,
          }

          logger.log({
            user_id: userId,
            endpoint: "/api/ml/personalize",
            duration_ms: Date.now() - startTime,
            provider_used: "personalized",
            fallback_used: false,
            items_count: topItems.length,
          })

          return NextResponse.json(response, { status: 200 })
        }
      }
    }

    console.log(`[v0] Using fallback feed for userId=${userId}`)

    const { data: topNews } = await supabase
      .from("article_metadata")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8)

    const { data: businessArticles } = await supabase
      .from("article_metadata")
      .select("*")
      .contains("tags", ["business"])
      .order("created_at", { ascending: false })
      .limit(4)

    const { data: techArticles } = await supabase
      .from("article_metadata")
      .select("*")
      .contains("tags", ["technology", "tech"])
      .order("created_at", { ascending: false })
      .limit(4)

    const { data: sportsArticles } = await supabase
      .from("article_metadata")
      .select("*")
      .contains("tags", ["sports"])
      .order("created_at", { ascending: false })
      .limit(4)

    // Deduplicate and merge
    const seenIds = new Set<string>()
    const fallbackItems: PersonalizedItem[] = []
    const buckets = ["top-news", "business", "tech", "sports"]
    ;[topNews, businessArticles, techArticles, sportsArticles].forEach((batch) => {
      if (batch) {
        batch.forEach((article) => {
          if (!seenIds.has(article.article_id)) {
            seenIds.add(article.article_id)
            fallbackItems.push({
              articleId: article.article_id,
              title: article.summary || "Article",
              score: 0.75,
              reason: "Top picks from news sources",
              category: article.tags?.[0] || "general",
              thumb: "",
              source: "NewsAPI",
              publishAt: article.created_at,
              credibility: 80,
            })
          }
        })
      }
    })

    const response: PersonalizeResponse = {
      items: fallbackItems.slice(0, limit),
      source: "fallback",
      fallbackBuckets: buckets,
      totalCount: fallbackItems.length,
    }

    logger.log({
      user_id: userId,
      endpoint: "/api/ml/personalize",
      duration_ms: Date.now() - startTime,
      provider_used: "fallback",
      fallback_used: true,
      items_count: fallbackItems.length,
    })

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("[v0] Personalize error:", error)
    logger.log({
      endpoint: "/api/ml/personalize",
      duration_ms: Date.now() - startTime,
      error: String(error),
    })

    return NextResponse.json({ error: "Failed to generate personalized feed" }, { status: 500 })
  }
}

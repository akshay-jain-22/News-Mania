import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createServerSupabaseClient } from "@/lib/supabase"
import { checkRateLimit } from "@/lib/auth-utils"
import { logger } from "@/lib/logger"
import { llmService } from "@/lib/llm-service"
import fallbackNewsData from "@/data/fallback-news.json"

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

    const supabase = createServerSupabaseClient()

    let interactions: any[] = []
    try {
      const { data, error } = await supabase
        .from("interactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.log("[v0] Interactions table query error (expected if table not created):", error.message)
      } else if (data) {
        interactions = data
      }
    } catch (tableError) {
      console.log("[v0] Interactions table not available, using fallback feed:", tableError)
    }

    // Build summary of user activity for LLM context
    const activityTypes = interactions
      .map((i) => (i.action || i.type || "").toLowerCase())
      .filter(Boolean)
      .slice(0, 5)
    const uniqueCategories = [
      ...new Set(interactions.map((i) => (i.category || i.tags?.[0] || "general").toLowerCase())),
    ].slice(0, 3)
    const userActivitySummary =
      interactions.length > 0
        ? `Recently read about ${uniqueCategories.join(", ")}. Activity: ${activityTypes.join(", ")}.`
        : "New reader"

    if (interactions.length > 0) {
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
              articleId: item.id,
              title: item.title || "Article",
              score: item.personalizedScore,
              reason: item.personalizedReason,
              category: (item.tags?.[0] || item.category || "general").toLowerCase(),
              thumb: item.thumb_url || "",
              source: item.source || "NewsAPI",
              publishAt: item.created_at,
              credibility: item.credibility_score || 0.85,
            })),
            source: "personalized",
            totalCount: topItems.length,
          }

          logger.log({
            level: "info",
            requestId: `req-${Date.now()}`,
            userId,
            endpoint: "/api/ml/personalize",
            message: "Personalized feed generated",
            metadata: {
              duration_ms: Date.now() - startTime,
              provider_used: "personalized",
              fallback_used: false,
              items_count: topItems.length,
            },
          })

          return NextResponse.json(response, { status: 200 })
        }
      }
    }

    console.log(`[v0] Using fallback feed for userId=${userId}`)

    // For text[] columns, use 'cs' (contains) operator instead of 'ilike'
    const topNewsResult = await supabase
      .from("article_metadata")
      .select("*")
      .order("credibility_score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data, error }: any) => {
        if (error) {
          console.log("[v0] Top news query failed:", error.message)
          return { data: null, error }
        }
        return { data, error: null }
      })

    const businessResult = await supabase
      .from("article_metadata")
      .select("*")
      .or(`category.eq.Business,tags.cs.{business}`)
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data, error }: any) => {
        if (error) {
          console.log("[v0] Business query failed:", error.message)
          return { data: null, error }
        }
        return { data, error: null }
      })

    const techResult = await supabase
      .from("article_metadata")
      .select("*")
      .or(`category.eq.Tech,tags.cs.{tech}`)
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data, error }: any) => {
        if (error) {
          console.log("[v0] Tech query failed:", error.message)
          return { data: null, error }
        }
        return { data, error: null }
      })

    const sportsResult = await supabase
      .from("article_metadata")
      .select("*")
      .or(`category.eq.Sports,tags.cs.{sports}`)
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data, error }: any) => {
        if (error) {
          console.log("[v0] Sports query failed:", error.message)
          return { data: null, error }
        }
        return { data, error: null }
      })

    // Deduplicate and merge all topic buckets
    const seenIds = new Set<string>()
    const fallbackItems: PersonalizedItem[] = []
    ;[topNewsResult.data, businessResult.data, techResult.data, sportsResult.data].forEach((batch) => {
      if (Array.isArray(batch)) {
        batch.forEach((article) => {
          if (article?.id && !seenIds.has(article.id)) {
            seenIds.add(article.id)
            fallbackItems.push({
              articleId: article.id,
              title: article.title || "Article",
              score: 0.75,
              reason: "Top picks from news sources",
              category: (article.tags?.[0] || article.category || "general").toLowerCase(),
              thumb: article.thumb_url || "",
              source: article.source || "NewsAPI",
              publishAt: article.created_at,
              credibility: Number(article.credibility_score) || 0.8,
            })
          }
        })
      }
    })

    // If all article_metadata queries failed, use bundled JSON fallback
    if (fallbackItems.length === 0) {
      console.log("[v0] article_metadata unavailable, using bundled JSON fallback")
      return NextResponse.json(
        {
          items: fallbackNewsData.slice(0, limit).map((item: any) => ({
            articleId: item.id,
            title: item.title,
            score: 0.7,
            reason: "Curated top news",
            category: item.category.toLowerCase(),
            thumb: item.thumb_url || "",
            source: item.source,
            publishAt: item.created_at,
            credibility: item.credibility_score || 0.75,
          })),
          source: "fallback",
          fallbackBuckets: ["top-news", "business", "tech", "sports"],
          totalCount: fallbackNewsData.length,
        },
        { status: 200 },
      )
    }

    const response: PersonalizeResponse = {
      items: fallbackItems.slice(0, limit),
      source: "fallback",
      fallbackBuckets: ["top-news", "business", "tech", "sports"],
      totalCount: fallbackItems.length,
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
        fallback_used: true,
        items_count: fallbackItems.length,
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

    // Final fallback: return bundled JSON
    return NextResponse.json(
      {
        items: fallbackNewsData.slice(0, 20).map((item: any) => ({
          articleId: item.id,
          title: item.title,
          score: 0.7,
          reason: "Curated top news",
          category: item.category.toLowerCase(),
          thumb: item.thumb_url || "",
          source: item.source,
          publishAt: item.created_at,
          credibility: item.credibility_score || 0.75,
        })),
        source: "fallback",
        fallbackBuckets: ["top-news", "business", "tech", "sports"],
        totalCount: fallbackNewsData.length,
      },
      { status: 200 },
    )
  }
}

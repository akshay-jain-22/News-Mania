import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  calculateCollaborativeScore,
  calculateContentScore,
  calculateDemographicScore,
  applyTimeDecay,
  calculateDiversityPenalty,
  type RecommendationScore,
} from "@/lib/ml-scoring"
import { verifyAuthToken, checkRateLimit } from "@/lib/auth-utils"
import { createServerSupabaseClient } from "@/lib/supabase"
import { publishRecommendationUpdate } from "@/lib/realtime-events"

const recommendSchema = z.object({
  userId: z.string().min(1),
  context: z.string().optional(),
  lastNInteractions: z.number().default(10),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request)

    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!checkRateLimit(`recommend:${auth.userId}`, 5, 60000)) {
      return NextResponse.json({ error: "Rate limit exceeded. Maximum 5 recommendations per minute." }, { status: 429 })
    }

    const body = await request.json()
    const { userId, context, lastNInteractions } = recommendSchema.parse(body)

    const supabase = createServerSupabaseClient()

    const { data: cachedRecs } = await supabase
      .from("recommendations_cache")
      .select("*")
      .eq("user_id", userId)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (cachedRecs) {
      return NextResponse.json(
        {
          recommendations: cachedRecs.recommendations,
          cacheHit: true,
          lastUpdated: cachedRecs.updated_at,
        },
        { status: 200 },
      )
    }

    const { data: interactions } = await supabase
      .from("interactions")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(lastNInteractions)

    const { data: userProfile } = await supabase.from("users").select("*").eq("id", userId).single()

    const { data: articles } = await supabase.from("articles").select("*").limit(100)

    if (!articles || articles.length === 0) {
      return NextResponse.json({ recommendations: [], cacheHit: false }, { status: 200 })
    }

    const scores: RecommendationScore[] = []

    for (const article of articles) {
      const collaborativeScore = await calculateCollaborativeScore(userId, article.id, interactions || [])
      const contentScore = await calculateContentScore(
        userProfile?.interests || ["general"],
        article.content || article.description || "",
      )
      const demographicScore = calculateDemographicScore(userProfile || {}, {
        category: article.category,
        source: article.source,
      })

      const timeDecay = applyTimeDecay(article.published_at)
      const diversityPenalty = calculateDiversityPenalty(
        article.id,
        (interactions || []).map((i) => i.article_id),
      )

      const baseScore = collaborativeScore * 0.4 + contentScore * 0.4 + demographicScore * 0.2

      const adjustedScore = baseScore * timeDecay * (1 - diversityPenalty)

      scores.push({
        articleId: article.id,
        score: adjustedScore,
        collaborativeScore,
        contentScore,
        demographicScore,
        diversityPenalty,
        explanation: `Recommended based on your reading history and interests (${Math.round(adjustedScore * 100)}% match)`,
      })
    }

    const topRecommendations = scores.sort((a, b) => b.score - a.score).slice(0, 10)

    await supabase.from("recommendations_cache").insert({
      user_id: userId,
      recommendations: topRecommendations,
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })

    topRecommendations.forEach((rec) => {
      publishRecommendationUpdate(userId, {
        articleId: rec.articleId,
        score: rec.score,
        reason: rec.explanation,
        updatedAt: new Date().toISOString(),
      })
    })

    return NextResponse.json(
      {
        recommendations: topRecommendations,
        cacheHit: false,
        lastUpdated: new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("Recommendation error:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}

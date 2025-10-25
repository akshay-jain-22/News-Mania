import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { calculateCredibilityScore, type CredibilityFactors } from "@/lib/ml-scoring"
import { verifyAuthToken, checkRateLimit } from "@/lib/auth-utils"
import { createServerSupabaseClient } from "@/lib/supabase"
import { publishCredibilityUpdate } from "@/lib/realtime-events"

const credibilitySchema = z.object({
  articleId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request)

    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!checkRateLimit(`credibility:${auth.userId}`, 20, 60000)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 20 credibility checks per minute." },
        { status: 429 },
      )
    }

    const body = await request.json()
    const { articleId } = credibilitySchema.parse(body)

    const supabase = createServerSupabaseClient()

    const { data: cachedCredibility } = await supabase
      .from("credibility_cache")
      .select("*")
      .eq("article_id", articleId)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (cachedCredibility) {
      return NextResponse.json(
        {
          score: cachedCredibility.score,
          factors: cachedCredibility.factors,
          explanation: cachedCredibility.explanation,
          cacheHit: true,
          lastUpdated: cachedCredibility.updated_at,
        },
        { status: 200 },
      )
    }

    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("*")
      .eq("id", articleId)
      .single()

    if (articleError || !article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    const factors: CredibilityFactors = {
      sourceReputation: calculateSourceReputation(article.source),
      factCheckScore: article.fact_check_score || 0.7,
      authorityScore: calculateAuthorityScore(article),
      recencyScore: calculateRecencyScore(article.published_at),
      engagementScore: calculateEngagementScore(article),
    }

    const score = calculateCredibilityScore(factors)

    const explanation = generateCredibilityExplanation(score, factors)

    await supabase.from("credibility_cache").insert({
      article_id: articleId,
      score,
      factors,
      explanation,
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    })

    publishCredibilityUpdate(
      articleId,
      {
        articleId,
        score,
        factors: Object.keys(factors),
        updatedAt: new Date().toISOString(),
      },
      [auth.userId], // In production, publish to all users viewing this article
    )

    return NextResponse.json(
      {
        score,
        factors,
        explanation,
        cacheHit: false,
        lastUpdated: new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("Credibility error:", error)
    return NextResponse.json({ error: "Failed to calculate credibility" }, { status: 500 })
  }
}

/**
 * Calculate source reputation score (0-1)
 */
function calculateSourceReputation(source: string): number {
  const trustedSources = ["BBC", "Reuters", "AP News", "NPR", "The Guardian", "The New York Times"]
  if (trustedSources.includes(source)) return 0.95
  if (source.length > 3) return 0.7
  return 0.5
}

/**
 * Calculate authority score based on article metadata
 */
function calculateAuthorityScore(article: any): number {
  let score = 0.6

  if (article.author) score += 0.15
  if (article.citations && article.citations.length > 0) score += 0.15
  if (article.fact_check_score && article.fact_check_score > 0.8) score += 0.1

  return Math.min(score, 1)
}

/**
 * Calculate recency score (newer articles score higher)
 */
function calculateRecencyScore(publishedAt: string): number {
  const ageMs = Date.now() - new Date(publishedAt).getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)

  if (ageDays < 1) return 1
  if (ageDays < 7) return 0.9
  if (ageDays < 30) return 0.7
  if (ageDays < 90) return 0.5
  return 0.3
}

/**
 * Calculate engagement score based on user interactions
 */
function calculateEngagementScore(article: any): number {
  const views = article.view_count || 0
  const shares = article.share_count || 0
  const comments = article.comment_count || 0

  const engagementScore = Math.min((views + shares * 2 + comments * 3) / 1000, 1)
  return 0.5 + engagementScore * 0.5
}

/**
 * Generate human-readable credibility explanation
 */
function generateCredibilityExplanation(score: number, factors: CredibilityFactors): string {
  if (score >= 85) {
    return "This article comes from a highly credible source with strong fact-checking and authority signals."
  } else if (score >= 70) {
    return "This article appears credible based on source reputation and fact-checking, though some factors could be stronger."
  } else if (score >= 50) {
    return "This article has mixed credibility signals. Consider cross-referencing with other sources."
  } else {
    return "This article has lower credibility indicators. Verify information with multiple sources before trusting."
  }
}

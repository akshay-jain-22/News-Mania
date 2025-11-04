import { createServerSupabaseClient } from "@/lib/supabase"

const TIME_DECAY_LAMBDA = Number.parseFloat(process.env.TIME_DECAY_LAMBDA || "0.1") // configurable decay rate

interface InteractionWeight {
  view: number
  read_complete: number
  save: number
  share: number
  summarize: number
  qa: number
}

const INTERACTION_WEIGHTS: InteractionWeight = {
  view: 1,
  read_complete: 2,
  save: 3,
  share: 2.5,
  summarize: 1.5,
  qa: 1.5,
}

/**
 * Apply exponential time decay to a contribution
 * contribution *= e^(-λ·Δt) where Δt is days since interaction
 */
export function applyTimeDecay(daysSinceInteraction: number): number {
  return Math.exp(-TIME_DECAY_LAMBDA * daysSinceInteraction)
}

/**
 * Compute weighted preference vector from user interactions
 */
export async function computeUserPreferences(userId: string) {
  const supabase = createServerSupabaseClient()

  const { data: interactions, error } = await supabase
    .from("interactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error || !interactions) {
    console.error("Error fetching interactions:", error)
    return { topCategories: [], topSources: [], score: 0 }
  }

  const categoryScores: Record<string, number> = {}
  const sourceScores: Record<string, number> = {}

  for (const interaction of interactions) {
    const daysSince = (Date.now() - new Date(interaction.created_at).getTime()) / (1000 * 60 * 60 * 24)
    const decayFactor = applyTimeDecay(daysSince)
    const weight = INTERACTION_WEIGHTS[interaction.action as keyof InteractionWeight] || 1
    const contribution = weight * decayFactor

    // Fetch article to get category and source
    const { data: article } = await supabase
      .from("articles")
      .select("category, source")
      .eq("id", interaction.article_id)
      .single()

    if (article) {
      categoryScores[article.category] = (categoryScores[article.category] || 0) + contribution
      sourceScores[article.source] = (sourceScores[article.source] || 0) + contribution
    }
  }

  const topCategories = Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, score]) => ({ category, score }))

  const topSources = Object.entries(sourceScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([source, score]) => ({ source, score }))

  const totalScore = Object.values(categoryScores).reduce((a, b) => a + b, 0)

  return { topCategories, topSources, score: totalScore }
}

/**
 * Generate personalized recommendations for a user
 */
export async function generateRecommendations(userId: string, limit = 10) {
  const supabase = createServerSupabaseClient()

  const prefs = await computeUserPreferences(userId)

  if (prefs.topCategories.length === 0) {
    // No preference history, return trending articles
    const { data: articles } = await supabase
      .from("articles")
      .select("*")
      .order("engagement_score", { ascending: false })
      .limit(limit)

    return (
      articles?.map((article) => ({
        articleId: article.id,
        score: article.engagement_score || 0,
        reason: "Trending now",
      })) || []
    )
  }

  // Fetch candidate articles from preferred categories
  const topCategory = prefs.topCategories[0]?.category
  const { data: candidates } = await supabase
    .from("articles")
    .select("*")
    .eq("category", topCategory)
    .order("published_at", { ascending: false })
    .limit(limit * 2)

  if (!candidates) return []

  // Score articles with diversity penalty
  const recommendations = candidates
    .map((article, index) => {
      let score = article.engagement_score || 50

      // Boost score based on category preference
      const categoryPref = prefs.topCategories.find((c) => c.category === article.category)
      if (categoryPref) {
        score *= 1 + categoryPref.score * 0.1
      }

      // Apply diversity penalty to avoid same source repetition
      const diversityPenalty = Math.pow(0.9, index / 5) // Decreasing penalty
      score *= diversityPenalty

      return {
        articleId: article.id,
        score,
        reason: `Based on your interest in ${topCategory}`,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return recommendations
}

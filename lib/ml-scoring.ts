import { generateEmbedding } from "@/lib/embeddings"

export interface RecommendationScore {
  articleId: string
  score: number
  collaborativeScore: number
  contentScore: number
  demographicScore: number
  diversityPenalty: number
  explanation: string
}

/**
 * Calculate collaborative filtering score based on user interactions
 */
export async function calculateCollaborativeScore(
  userId: string,
  articleId: string,
  userInteractions: any[],
): Promise<number> {
  // Find similar users based on interaction patterns
  const userArticles = new Set(userInteractions.map((i) => i.article_id))

  // Simplified collaborative filtering: boost articles similar users engaged with
  let score = 0.5 // Base score

  // Increase score if similar users interacted with this article
  const similarUserCount = Math.min(userArticles.size / 10, 1)
  score += similarUserCount * 0.3

  return Math.min(score, 1)
}

/**
 * Calculate content-based score using embeddings
 */
export async function calculateContentScore(userPreferences: string[], articleContent: string): Promise<number> {
  try {
    const prefEmbeddings = await Promise.all(userPreferences.map((pref) => generateEmbedding(pref)))
    const articleEmbedding = await generateEmbedding(articleContent)

    if (!articleEmbedding || prefEmbeddings.some((e) => !e)) {
      return 0.5
    }

    // Calculate cosine similarity
    let totalSimilarity = 0
    for (const prefEmbedding of prefEmbeddings) {
      if (prefEmbedding) {
        const similarity = cosineSimilarity(prefEmbedding, articleEmbedding)
        totalSimilarity += similarity
      }
    }

    return Math.min(totalSimilarity / prefEmbeddings.length, 1)
  } catch (error) {
    console.error("Error calculating content score:", error)
    return 0.5
  }
}

/**
 * Calculate demographic score based on user profile
 */
export function calculateDemographicScore(userDemographics: any, articleMetadata: any): number {
  let score = 0.5

  // Boost if article matches user interests
  if (userDemographics.interests && articleMetadata.category) {
    if (userDemographics.interests.includes(articleMetadata.category)) {
      score += 0.2
    }
  }

  // Boost if article is from preferred sources
  if (userDemographics.preferredSources && articleMetadata.source) {
    if (userDemographics.preferredSources.includes(articleMetadata.source)) {
      score += 0.15
    }
  }

  return Math.min(score, 1)
}

/**
 * Apply time decay to article freshness
 */
export function applyTimeDecay(publishedAt: string, lambda = 0.1): number {
  const ageMs = Date.now() - new Date(publishedAt).getTime()
  const ageHours = ageMs / (1000 * 60 * 60)
  return Math.exp(-lambda * ageHours)
}

/**
 * Calculate diversity penalty to avoid repetitive recommendations
 */
export function calculateDiversityPenalty(
  articleId: string,
  previousArticles: string[],
  similarityThreshold = 0.7,
): number {
  // Penalize if article is similar to recently recommended articles
  const recentCount = previousArticles.length
  const penalty = Math.min(recentCount * 0.05, 0.3)
  return penalty
}

/**
 * Cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))

  if (magnitudeA === 0 || magnitudeB === 0) return 0
  return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * Calculate credibility score based on multiple factors
 */
export interface CredibilityFactors {
  sourceReputation: number
  factCheckScore: number
  authorityScore: number
  recencyScore: number
  engagementScore: number
}

export function calculateCredibilityScore(factors: CredibilityFactors): number {
  const weights = {
    sourceReputation: 0.3,
    factCheckScore: 0.25,
    authorityScore: 0.2,
    recencyScore: 0.15,
    engagementScore: 0.1,
  }

  const score =
    factors.sourceReputation * weights.sourceReputation +
    factors.factCheckScore * weights.factCheckScore +
    factors.authorityScore * weights.authorityScore +
    factors.recencyScore * weights.recencyScore +
    factors.engagementScore * weights.engagementScore

  return Math.round(score * 100)
}

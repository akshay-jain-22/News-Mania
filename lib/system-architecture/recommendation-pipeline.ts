import type { NewsArticle } from "@/types/news"

export interface RecommendationScore {
  articleId: string
  score: number
  reasons: string[]
  confidence: number
  pipeline: string
}

export interface UserPreferences {
  userId: string
  categories: string[]
  sources: string[]
  authorPreferences: string[]
  readingFrequency: "morning" | "afternoon" | "evening" | "night"
}

/**
 * Recommendation Pipeline - Simple, efficient recommendation engine
 */
export class RecommendationPipelineClass {
  private userPreferences = new Map<string, UserPreferences>()
  private readingHistory = new Map<string, Set<string>>()

  /**
   * Generate recommendations for a user
   */
  async generateRecommendations(
    userId: string,
    articles: NewsArticle[],
    limit = 10,
  ): Promise<{
    recommendations: RecommendationScore[]
    pipeline: string
    confidence: number
  }> {
    try {
      const userPrefs = this.userPreferences.get(userId)
      const userHistory = this.readingHistory.get(userId) || new Set()

      // If no user preferences, use trending articles
      if (!userPrefs) {
        return this.getTrendingRecommendations(articles, limit)
      }

      // Score each article
      const scores = articles.map((article) => {
        let score = 0
        const reasons: string[] = []

        // Check if article was already read
        if (userHistory.has(article.id)) {
          score -= 0.5
        }

        // Category preference matching
        if (userPrefs.categories.length > 0) {
          const matchingCategories = userPrefs.categories.filter((cat) =>
            article.title.toLowerCase().includes(cat.toLowerCase()),
          )
          if (matchingCategories.length > 0) {
            score += 0.4
            reasons.push(`Matches your ${matchingCategories.join(", ")} interests`)
          }
        }

        // Source preference matching
        if (userPrefs.sources.length > 0 && article.source) {
          if (userPrefs.sources.includes(article.source.name)) {
            score += 0.3
            reasons.push(`From your preferred source: ${article.source.name}`)
          }
        }

        // Freshness boost
        const hoursOld = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60)
        if (hoursOld < 2) {
          score += 0.2
          reasons.push("Recently published")
        } else if (hoursOld < 6) {
          score += 0.1
          reasons.push("Fresh content")
        }

        // Popularity/engagement boost
        score += 0.1 // Base score for all articles

        return {
          articleId: article.id,
          score: Math.max(0, Math.min(score, 1)),
          reasons: reasons.length > 0 ? reasons : ["Recommended for you"],
          confidence: 0.7,
          pipeline: "personalized",
        }
      })

      // Sort and limit
      const recommendations = scores.sort((a, b) => b.score - a.score).slice(0, limit)

      return {
        recommendations,
        pipeline: "personalized",
        confidence: 0.75,
      }
    } catch (error) {
      console.error("Error generating recommendations:", error)
      return this.getTrendingRecommendations(articles, limit)
    }
  }

  /**
   * Get trending articles as fallback
   */
  private getTrendingRecommendations(
    articles: NewsArticle[],
    limit: number,
  ): {
    recommendations: RecommendationScore[]
    pipeline: string
    confidence: number
  } {
    const recommendations = articles.slice(0, limit).map((article) => ({
      articleId: article.id,
      score: 0.5,
      reasons: ["Trending now"],
      confidence: 0.5,
      pipeline: "trending",
    }))

    return {
      recommendations,
      pipeline: "trending",
      confidence: 0.5,
    }
  }

  /**
   * Track user reading behavior
   */
  trackReading(userId: string, articleId: string): void {
    if (!this.readingHistory.has(userId)) {
      this.readingHistory.set(userId, new Set())
    }
    this.readingHistory.get(userId)?.add(articleId)
  }

  /**
   * Store user preferences
   */
  setUserPreferences(userId: string, preferences: UserPreferences): void {
    this.userPreferences.set(userId, preferences)
  }

  /**
   * Get user preferences
   */
  getUserPreferences(userId: string): UserPreferences | undefined {
    return this.userPreferences.get(userId)
  }

  /**
   * Clear user data
   */
  clearUserData(userId: string): void {
    this.userPreferences.delete(userId)
    this.readingHistory.delete(userId)
  }
}

// Export singleton instance
export const recommendationPipeline = new RecommendationPipelineClass()

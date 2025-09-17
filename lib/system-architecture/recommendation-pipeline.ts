import type { UserProfile, NewsArticle, RecommendationScore } from "@/types/user-profile"
import { NewsClassifier } from "../mathematical-models/news-classifier"
import { PersonalizationEngine } from "../mathematical-models/personalization-engine"
import { BehavioralAnalyzer } from "../mathematical-models/behavioral-analyzer"
import { ColdStartHandler } from "../mathematical-models/cold-start-handler"
import { PreferenceManager } from "../data-storage/preference-manager"

export class RecommendationPipeline {
  private newsClassifier: NewsClassifier
  private personalizationEngine: PersonalizationEngine
  private behavioralAnalyzer: BehavioralAnalyzer
  private coldStartHandler: ColdStartHandler
  private preferenceManager: PreferenceManager

  constructor() {
    this.newsClassifier = new NewsClassifier()
    this.personalizationEngine = new PersonalizationEngine()
    this.behavioralAnalyzer = new BehavioralAnalyzer()
    this.coldStartHandler = new ColdStartHandler()
    this.preferenceManager = new PreferenceManager()
  }

  /**
   * Main recommendation pipeline
   */
  async generateRecommendations(
    userId: string,
    articles: NewsArticle[],
    options: {
      limit?: number
      diversityFactor?: number
      freshnessFactor?: number
      personalizedWeight?: number
    } = {},
  ): Promise<{
    recommendations: RecommendationScore[]
    pipeline: string
    confidence: number
    reasoning: string[]
  }> {
    const { limit = 20, diversityFactor = 0.3, freshnessFactor = 0.2, personalizedWeight = 0.8 } = options

    try {
      // Get user profile
      const userProfile = await this.preferenceManager.getUserPreferences(userId)

      if (!userProfile) {
        return this.handleNewUser(userId, articles, limit)
      }

      // Determine if user has enough interaction history
      const interactionCount = userProfile.behaviorProfile.interactionHistory.length
      const isNewUser = interactionCount < 10

      let recommendations: RecommendationScore[]
      let pipeline: string
      let confidence: number
      let reasoning: string[]

      if (isNewUser) {
        // Cold start pipeline
        const result = await this.coldStartPipeline(userProfile, articles)
        recommendations = result.recommendations
        pipeline = result.pipeline
        confidence = result.confidence
        reasoning = result.reasoning
      } else {
        // Full personalization pipeline
        const result = await this.personalizedPipeline(userProfile, articles)
        recommendations = result.recommendations
        pipeline = result.pipeline
        confidence = result.confidence
        reasoning = result.reasoning
      }

      // Apply diversity and freshness filters
      recommendations = this.applyDiversityFilter(recommendations, diversityFactor)
      recommendations = this.applyFreshnessBoost(recommendations, articles, freshnessFactor)

      // Apply final ranking and limit
      recommendations = recommendations.sort((a, b) => b.score - a.score).slice(0, limit)

      return {
        recommendations,
        pipeline,
        confidence,
        reasoning,
      }
    } catch (error) {
      console.error("Error in recommendation pipeline:", error)

      // Fallback to trending articles
      return this.fallbackRecommendations(articles, limit)
    }
  }

  /**
   * Cold start pipeline for new users
   */
  private async coldStartPipeline(
    userProfile: UserProfile,
    articles: NewsArticle[],
  ): Promise<{
    recommendations: RecommendationScore[]
    pipeline: string
    confidence: number
    reasoning: string[]
  }> {
    const strategy = this.coldStartHandler.selectColdStartStrategy(userProfile.id)
    let recommendations: RecommendationScore[] = []
    let confidence = 0.4
    const reasoning: string[] = [`Using ${strategy} cold start strategy`]

    switch (strategy) {
      case "demographic":
        recommendations = this.coldStartHandler.generateTrendBasedRecommendations(
          articles,
          userProfile.location.country,
        )
        reasoning.push("Based on demographic profile and trending topics")
        break

      case "llm":
        try {
          const llmPrefs = await this.coldStartHandler.generateLLMBasedPreferences(userProfile)
          recommendations = this.generateLLMBasedRecommendations(articles, llmPrefs)
          confidence = llmPrefs.confidence
          reasoning.push("AI-generated preferences based on profile")
        } catch (error) {
          // Fallback to demographic
          recommendations = this.coldStartHandler.generateTrendBasedRecommendations(articles)
          reasoning.push("Fallback to trending topics due to AI error")
        }
        break

      case "trending":
        recommendations = this.coldStartHandler.generateTrendBasedRecommendations(articles)
        reasoning.push("Global trending topics and popular content")
        break

      case "hybrid":
        const trendingRecs = this.coldStartHandler.generateTrendBasedRecommendations(articles)
        const demographicRecs = this.personalizationEngine.demographicFiltering(userProfile, articles)
        recommendations = this.combineRecommendations([trendingRecs, demographicRecs], [0.6, 0.4])
        reasoning.push("Hybrid approach combining trends and demographics")
        break
    }

    return {
      recommendations,
      pipeline: `cold_start_${strategy}`,
      confidence,
      reasoning,
    }
  }

  /**
   * Full personalization pipeline for experienced users
   */
  private async personalizedPipeline(
    userProfile: UserProfile,
    articles: NewsArticle[],
  ): Promise<{
    recommendations: RecommendationScore[]
    pipeline: string
    confidence: number
    reasoning: string[]
  }> {
    // Get user interaction map
    const userInteractions = new Map<string, number>()
    userProfile.behaviorProfile.categoryPreferences.forEach((cp) => {
      userInteractions.set(cp.category, cp.score)
    })

    // Generate predictions for current time
    const predictions = this.behavioralAnalyzer.predictFuturePreferences(userProfile, new Date())

    // Get recommendations from all methods
    const [collaborativeRecs, contentRecs, demographicRecs, behavioralRecs] = await Promise.all([
      this.personalizationEngine.collaborativeFiltering(userProfile.id, articles, userInteractions),
      this.personalizationEngine.contentBasedFiltering(userProfile, articles),
      this.personalizationEngine.demographicFiltering(userProfile, articles),
      this.generateBehavioralRecommendations(userProfile, articles, predictions),
    ])

    // Combine with adaptive weights based on user engagement
    const engagementScore = userProfile.behaviorProfile.engagementScore
    const weights = this.calculateAdaptiveWeights(engagementScore)

    const recommendations = this.combineRecommendations(
      [collaborativeRecs, contentRecs, demographicRecs, behavioralRecs],
      weights,
    )

    const confidence = Math.min(engagementScore + 0.3, 0.95)
    const reasoning = [
      "Personalized recommendations based on your reading history",
      `Predicted preferences for current time: ${predictions.nextHourCategories.join(", ")}`,
      `Engagement-based weighting applied (score: ${engagementScore.toFixed(2)})`,
    ]

    return {
      recommendations,
      pipeline: "personalized_hybrid",
      confidence,
      reasoning,
    }
  }

  /**
   * Handle completely new users
   */
  private async handleNewUser(
    userId: string,
    articles: NewsArticle[],
    limit: number,
  ): Promise<{
    recommendations: RecommendationScore[]
    pipeline: string
    confidence: number
    reasoning: string[]
  }> {
    // Generate trending-based recommendations
    const recommendations = this.coldStartHandler.generateTrendBasedRecommendations(articles).slice(0, limit)

    return {
      recommendations,
      pipeline: "new_user_trending",
      confidence: 0.3,
      reasoning: ["New user - showing trending and popular content"],
    }
  }

  /**
   * Generate behavioral recommendations based on time predictions
   */
  private generateBehavioralRecommendations(
    userProfile: UserProfile,
    articles: NewsArticle[],
    predictions: any,
  ): RecommendationScore[] {
    const scores: RecommendationScore[] = []

    for (const article of articles) {
      let score = 0
      const reasons: string[] = []

      // Time-based preference boost
      if (predictions.nextHourCategories.includes(article.category)) {
        score += 0.4
        reasons.push("Matches your typical reading time preferences")
      }

      // Daily recommendation boost
      if (predictions.todayRecommendations.includes(article.category)) {
        score += 0.3
        reasons.push("Recommended for today based on your patterns")
      }

      // Weekly trend boost
      if (predictions.weeklyTrend.includes(article.category)) {
        score += 0.2
        reasons.push("Aligns with your weekly reading trends")
      }

      scores.push({
        articleId: article.id,
        score: Math.max(0, Math.min(score, 1)),
        reasons,
        confidence: predictions.confidence,
        pipeline: "behavioral",
      })
    }

    return scores.sort((a, b) => b.score - a.score)
  }

  /**
   * Combine multiple recommendation lists with weights
   */
  private combineRecommendations(
    recommendationLists: RecommendationScore[][],
    weights: number[],
  ): RecommendationScore[] {
    const combinedScores = new Map<string, RecommendationScore>()

    for (let i = 0; i < recommendationLists.length; i++) {
      const recommendations = recommendationLists[i]
      const weight = weights[i]

      for (const rec of recommendations) {
        const existing = combinedScores.get(rec.articleId)

        if (existing) {
          existing.score += rec.score * weight
          existing.reasons.push(...rec.reasons)
          existing.confidence = Math.max(existing.confidence, rec.confidence)
        } else {
          combinedScores.set(rec.articleId, {
            ...rec,
            score: rec.score * weight,
            reasons: [...rec.reasons],
          })
        }
      }
    }

    return Array.from(combinedScores.values())
      .map((rec) => ({
        ...rec,
        reasons: [...new Set(rec.reasons)], // Remove duplicates
      }))
      .sort((a, b) => b.score - a.score)
  }

  /**
   * Calculate adaptive weights based on user engagement
   */
  private calculateAdaptiveWeights(engagementScore: number): number[] {
    // Higher engagement = more weight on behavioral and collaborative
    // Lower engagement = more weight on content and demographic

    if (engagementScore > 0.7) {
      return [0.4, 0.3, 0.1, 0.2] // [collaborative, content, demographic, behavioral]
    } else if (engagementScore > 0.4) {
      return [0.3, 0.4, 0.2, 0.1]
    } else {
      return [0.2, 0.3, 0.4, 0.1]
    }
  }

  /**
   * Apply diversity filter to avoid echo chambers
   */
  private applyDiversityFilter(recommendations: RecommendationScore[], diversityFactor: number): RecommendationScore[] {
    if (diversityFactor === 0) return recommendations

    const diversified: RecommendationScore[] = []
    const categoryCount = new Map<string, number>()

    for (const rec of recommendations) {
      // Get article category (you'd need to pass articles or store category in rec)
      const category = "general" // Simplified - would need actual category
      const currentCount = categoryCount.get(category) || 0

      // Apply diversity penalty
      const diversityPenalty = currentCount * diversityFactor * 0.1
      const adjustedScore = Math.max(0, rec.score - diversityPenalty)

      diversified.push({
        ...rec,
        score: adjustedScore,
      })

      categoryCount.set(category, currentCount + 1)
    }

    return diversified.sort((a, b) => b.score - a.score)
  }

  /**
   * Apply freshness boost to recent articles
   */
  private applyFreshnessBoost(
    recommendations: RecommendationScore[],
    articles: NewsArticle[],
    freshnessFactor: number,
  ): RecommendationScore[] {
    if (freshnessFactor === 0) return recommendations

    const now = Date.now()

    return recommendations.map((rec) => {
      const article = articles.find((a) => a.id === rec.articleId)
      if (!article) return rec

      const hoursOld = (now - article.publishedAt.getTime()) / (1000 * 60 * 60)
      const freshnessBoost = Math.max(0, (24 - hoursOld) / 24) * freshnessFactor

      return {
        ...rec,
        score: Math.min(1, rec.score + freshnessBoost),
      }
    })
  }

  /**
   * Generate LLM-based recommendations
   */
  private generateLLMBasedRecommendations(articles: NewsArticle[], llmPrefs: any): RecommendationScore[] {
    const scores: RecommendationScore[] = []

    for (const article of articles) {
      let score = 0.3 // Base score
      const reasons: string[] = []

      if (llmPrefs.categories.includes(article.category)) {
        score += 0.5
        reasons.push("AI predicted interest in this category")
      }

      scores.push({
        articleId: article.id,
        score: Math.min(score, 1),
        reasons,
        confidence: llmPrefs.confidence,
        pipeline: "cold_start",
      })
    }

    return scores.sort((a, b) => b.score - a.score)
  }

  /**
   * Fallback recommendations when all else fails
   */
  private fallbackRecommendations(
    articles: NewsArticle[],
    limit: number,
  ): {
    recommendations: RecommendationScore[]
    pipeline: string
    confidence: number
    reasoning: string[]
  } {
    const recommendations = articles.slice(0, limit).map((article) => ({
      articleId: article.id,
      score: 0.5,
      reasons: ["Fallback recommendation"],
      confidence: 0.2,
      pipeline: "fallback" as const,
    }))

    return {
      recommendations,
      pipeline: "fallback",
      confidence: 0.2,
      reasoning: ["System fallback - showing recent articles"],
    }
  }

  /**
   * A/B testing framework
   */
  async runABTest(
    userId: string,
    articles: NewsArticle[],
    testVariants: string[],
  ): Promise<{
    variant: string
    recommendations: RecommendationScore[]
    testId: string
  }> {
    // Simple hash-based assignment
    const hash = this.simpleHash(userId)
    const variant = testVariants[hash % testVariants.length]
    const testId = `ab_test_${Date.now()}_${hash}`

    // Generate recommendations based on variant
    let recommendations: RecommendationScore[]

    switch (variant) {
      case "collaborative_heavy":
        recommendations = await this.generateVariantRecommendations(userId, articles, [0.6, 0.2, 0.1, 0.1])
        break
      case "content_heavy":
        recommendations = await this.generateVariantRecommendations(userId, articles, [0.2, 0.6, 0.1, 0.1])
        break
      case "behavioral_heavy":
        recommendations = await this.generateVariantRecommendations(userId, articles, [0.2, 0.2, 0.1, 0.5])
        break
      default:
        const result = await this.generateRecommendations(userId, articles)
        recommendations = result.recommendations
    }

    return {
      variant,
      recommendations,
      testId,
    }
  }

  private async generateVariantRecommendations(
    userId: string,
    articles: NewsArticle[],
    weights: number[],
  ): Promise<RecommendationScore[]> {
    const userProfile = await this.preferenceManager.getUserPreferences(userId)
    if (!userProfile) {
      return this.coldStartHandler.generateTrendBasedRecommendations(articles)
    }

    const userInteractions = new Map<string, number>()
    userProfile.behaviorProfile.categoryPreferences.forEach((cp) => {
      userInteractions.set(cp.category, cp.score)
    })

    const [collaborative, content, demographic, behavioral] = await Promise.all([
      this.personalizationEngine.collaborativeFiltering(userId, articles, userInteractions),
      this.personalizationEngine.contentBasedFiltering(userProfile, articles),
      this.personalizationEngine.demographicFiltering(userProfile, articles),
      this.generateBehavioralRecommendations(
        userProfile,
        articles,
        this.behavioralAnalyzer.predictFuturePreferences(userProfile, new Date()),
      ),
    ])

    return this.combineRecommendations([collaborative, content, demographic, behavioral], weights)
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }
}

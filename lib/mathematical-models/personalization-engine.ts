import type {
  UserCredentials,
  UserBehavior,
  UserPreferences,
  NewsArticle,
  RecommendationRequest,
  RecommendationResult,
} from "@/types/user-profile"

/**
 * Mathematical Model 2: Personalization Engine
 * Uses collaborative filtering, content-based filtering, and demographic analysis
 */

export class PersonalizationEngine {
  private userSimilarityCache: Map<string, Map<string, number>> = new Map()
  private itemSimilarityCache: Map<string, Map<string, number>> = new Map()

  /**
   * Collaborative Filtering using Cosine Similarity
   * Formula: similarity(u1, u2) = (u1 · u2) / (||u1|| * ||u2||)
   */
  async calculateUserSimilarity(user1Behaviors: UserBehavior[], user2Behaviors: UserBehavior[]): Promise<number> {
    // Create user-item interaction matrices
    const user1Vector = this.createUserVector(user1Behaviors)
    const user2Vector = this.createUserVector(user2Behaviors)

    return this.cosineSimilarity(user1Vector, user2Vector)
  }

  /**
   * Content-Based Filtering using TF-IDF and user preferences
   * Formula: ContentScore = Σ(preference_weight * content_feature_score)
   */
  calculateContentBasedScore(article: NewsArticle, userPreferences: UserPreferences): number {
    let score = 0

    // Category preference matching
    const categoryWeight = userPreferences.category_weights[article.category] || 0
    score += categoryWeight * 0.4

    // Source reliability preference
    const sourceWeight = userPreferences.source_preferences[article.source.name] || 0.5
    score += sourceWeight * article.source.reliability_score * 0.2

    // Content length preference matching
    const lengthScore = this.calculateLengthPreferenceScore(article, userPreferences.content_length_preference)
    score += lengthScore * 0.15

    // Recency preference
    const recencyScore = this.calculateRecencyScore(article.publishedAt, userPreferences.recency_preference)
    score += recencyScore * 0.15

    // Location relevance
    score += article.location_relevance.global_relevance * userPreferences.location_relevance * 0.1

    return Math.min(score, 1)
  }

  /**
   * Demographic-based scoring using user credentials
   * Uses statistical models based on age, profession, and location patterns
   */
  calculateDemographicScore(article: NewsArticle, userCredentials: UserCredentials): number {
    let score = 0

    // Age-based preferences (statistical approximation)
    const agePreferences = this.getAgeBasedPreferences(userCredentials.age)
    score += (agePreferences[article.category] || 0.3) * 0.3

    // Profession-based preferences
    const professionPreferences = this.getProfessionBasedPreferences(userCredentials.profession)
    score += (professionPreferences[article.category] || 0.3) * 0.3

    // Location-based preferences
    const locationPreferences = this.getLocationBasedPreferences(userCredentials.location.country)
    score += (locationPreferences[article.category] || 0.3) * 0.2

    // Interest matching
    const interestScore = this.calculateInterestMatch(article, userCredentials.interests)
    score += interestScore * 0.2

    return Math.min(score, 1)
  }

  /**
   * Hybrid recommendation combining multiple approaches
   * Formula: HybridScore = α*CollaborativeScore + β*ContentScore + γ*DemographicScore + δ*PopularityScore
   */
  async generateRecommendations(
    request: RecommendationRequest,
    userCredentials: UserCredentials,
    userPreferences: UserPreferences,
    userBehaviors: UserBehavior[],
    availableArticles: NewsArticle[],
  ): Promise<RecommendationResult[]> {
    const recommendations: RecommendationResult[] = []

    // Weights for hybrid approach
    const weights = {
      collaborative: 0.25,
      content: 0.35,
      demographic: 0.25,
      popularity: 0.15,
    }

    for (const article of availableArticles) {
      // Skip if user has already seen this article
      if (request.exclude_seen && this.hasUserSeenArticle(request.user_id, article.id, userBehaviors)) {
        continue
      }

      // Calculate individual scores
      const contentScore = this.calculateContentBasedScore(article, userPreferences)
      const demographicScore = this.calculateDemographicScore(article, userCredentials)
      const popularityScore = this.calculatePopularityScore(article)

      // Collaborative score (simplified - in production, use matrix factorization)
      const collaborativeScore = await this.calculateCollaborativeScore(request.user_id, article, userBehaviors)

      // Time-based relevance
      const timeRelevance = this.calculateTimeRelevance(article, userPreferences, request.time_context)

      // Location relevance
      const locationRelevance = article.location_relevance.global_relevance

      // Novelty score (diversity factor)
      const noveltyScore = this.calculateNoveltyScore(article, userBehaviors, userPreferences.diversity_factor)

      // Calculate final hybrid score
      const hybridScore =
        (weights.collaborative * collaborativeScore +
          weights.content * contentScore +
          weights.demographic * demographicScore +
          weights.popularity * popularityScore) *
        timeRelevance *
        (1 + noveltyScore * 0.2)

      // Calculate confidence based on data availability
      const confidence = this.calculateConfidence(userBehaviors.length, userPreferences.confidence_score)

      recommendations.push({
        article,
        score: hybridScore,
        reasoning: {
          category_match: contentScore,
          time_relevance: timeRelevance,
          location_relevance: locationRelevance,
          behavioral_match: collaborativeScore,
          novelty_score: noveltyScore,
          overall_confidence: confidence,
        },
        explanation: this.generateExplanation(article, contentScore, demographicScore, timeRelevance),
      })
    }

    // Sort by score and apply diversity filter
    const sortedRecommendations = recommendations.sort((a, b) => b.score - a.score).slice(0, request.limit * 2) // Get more for diversity filtering

    // Apply diversity filtering
    const diverseRecommendations = this.applyDiversityFilter(
      sortedRecommendations,
      request.limit,
      userPreferences.diversity_factor,
    )

    return diverseRecommendations
  }

  private createUserVector(behaviors: UserBehavior[]): Record<string, number> {
    const vector: Record<string, number> = {}

    for (const behavior of behaviors) {
      const weight = this.getActionWeight(behavior.action)
      const timeDecay = this.calculateTimeDecay(behavior.timestamp)

      vector[behavior.article_id] = (vector[behavior.article_id] || 0) + weight * timeDecay
    }

    return vector
  }

  private cosineSimilarity(vector1: Record<string, number>, vector2: Record<string, number>): number {
    const keys1 = Object.keys(vector1)
    const keys2 = Object.keys(vector2)
    const commonKeys = keys1.filter((key) => keys2.includes(key))

    if (commonKeys.length === 0) return 0

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (const key of commonKeys) {
      dotProduct += vector1[key] * vector2[key]
    }

    for (const key of keys1) {
      norm1 += vector1[key] ** 2
    }

    for (const key of keys2) {
      norm2 += vector2[key] ** 2
    }

    if (norm1 === 0 || norm2 === 0) return 0

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  private getActionWeight(action: UserBehavior["action"]): number {
    const weights = {
      view: 1,
      click: 2,
      read: 4,
      share: 6,
      save: 5,
      like: 3,
      dislike: -2,
      skip: -1,
    }
    return weights[action] || 0
  }

  private calculateTimeDecay(timestamp: string): number {
    const now = new Date().getTime()
    const actionTime = new Date(timestamp).getTime()
    const daysDiff = (now - actionTime) / (1000 * 60 * 60 * 24)

    // Exponential decay: e^(-λt) where λ = 0.1
    return Math.exp(-0.1 * daysDiff)
  }

  private calculateLengthPreferenceScore(
    article: NewsArticle,
    preference: UserPreferences["content_length_preference"],
  ): number {
    const readTime = article.estimated_read_time

    switch (preference) {
      case "short":
        return readTime <= 3 ? 1 : Math.max(0, 1 - (readTime - 3) * 0.2)
      case "medium":
        return readTime >= 3 && readTime <= 8 ? 1 : Math.max(0, 1 - Math.abs(readTime - 5.5) * 0.15)
      case "long":
        return readTime >= 8 ? 1 : Math.max(0, (readTime - 3) * 0.2)
      case "mixed":
        return 0.8 // Neutral preference
      default:
        return 0.5
    }
  }

  private calculateRecencyScore(publishedAt: string, recencyPreference: number): number {
    const now = new Date().getTime()
    const publishTime = new Date(publishedAt).getTime()
    const hoursDiff = (now - publishTime) / (1000 * 60 * 60)

    // Recency score decreases over time
    const baseScore = Math.exp(-hoursDiff / 24) // Decay over 24 hours

    // Apply user's recency preference
    return baseScore * recencyPreference + (1 - recencyPreference) * 0.5
  }

  private getAgeBasedPreferences(age: number): Record<string, number> {
    // Statistical approximations based on demographic research
    if (age < 25) {
      return { technology: 0.8, entertainment: 0.7, sports: 0.6, politics: 0.3, business: 0.4 }
    } else if (age < 35) {
      return { technology: 0.7, business: 0.6, politics: 0.5, entertainment: 0.5, sports: 0.5 }
    } else if (age < 50) {
      return { business: 0.7, politics: 0.6, health: 0.5, technology: 0.5, sports: 0.4 }
    } else {
      return { politics: 0.8, health: 0.7, business: 0.6, environment: 0.5, technology: 0.3 }
    }
  }

  private getProfessionBasedPreferences(profession: string): Record<string, number> {
    const professionMap: Record<string, Record<string, number>> = {
      software_engineer: { technology: 0.9, business: 0.6, science: 0.5 },
      doctor: { health: 0.9, science: 0.7, politics: 0.4 },
      teacher: { education: 0.8, politics: 0.6, science: 0.5 },
      business_analyst: { business: 0.9, politics: 0.6, technology: 0.5 },
      journalist: { politics: 0.8, business: 0.7, entertainment: 0.6 },
      student: { technology: 0.7, entertainment: 0.6, sports: 0.5 },
    }

    return (
      professionMap[profession.toLowerCase().replace(" ", "_")] || {
        politics: 0.5,
        business: 0.5,
        technology: 0.5,
        entertainment: 0.4,
      }
    )
  }

  private getLocationBasedPreferences(country: string): Record<string, number> {
    // Simplified location-based preferences
    const locationMap: Record<string, Record<string, number>> = {
      US: { politics: 0.7, business: 0.8, technology: 0.8, sports: 0.7 },
      UK: { politics: 0.8, business: 0.7, entertainment: 0.6, sports: 0.6 },
      India: { politics: 0.6, technology: 0.7, business: 0.6, entertainment: 0.8 },
      Germany: { business: 0.8, politics: 0.7, environment: 0.7, technology: 0.6 },
    }

    return locationMap[country] || { politics: 0.5, business: 0.5, technology: 0.5 }
  }

  private calculateInterestMatch(article: NewsArticle, interests: string[]): number {
    if (interests.length === 0) return 0.3

    const articleText = `${article.title} ${article.description} ${article.keywords.join(" ")}`.toLowerCase()
    let matchCount = 0

    for (const interest of interests) {
      if (articleText.includes(interest.toLowerCase())) {
        matchCount++
      }
    }

    return Math.min(matchCount / interests.length, 1)
  }

  private calculatePopularityScore(article: NewsArticle): number {
    const metrics = article.engagement_metrics
    const totalEngagement = metrics.views + metrics.shares * 5 + metrics.likes * 2 + metrics.comments * 3

    // Normalize using log scale to prevent outliers from dominating
    return Math.min(Math.log(totalEngagement + 1) / Math.log(10000), 1)
  }

  private async calculateCollaborativeScore(
    userId: string,
    article: NewsArticle,
    userBehaviors: UserBehavior[],
  ): Promise<number> {
    // Simplified collaborative filtering
    // In production, use matrix factorization or deep learning approaches

    const similarUsers = await this.findSimilarUsers(userId, userBehaviors)
    if (similarUsers.length === 0) return 0.3

    let weightedScore = 0
    let totalWeight = 0

    for (const { userId: similarUserId, similarity } of similarUsers) {
      const userScore = await this.getUserArticleScore(similarUserId, article.id)
      weightedScore += similarity * userScore
      totalWeight += similarity
    }

    return totalWeight > 0 ? weightedScore / totalWeight : 0.3
  }

  private calculateTimeRelevance(article: NewsArticle, preferences: UserPreferences, timeContext?: string): number {
    if (timeContext !== "current") return 1

    const currentHour = new Date().getHours()
    const timePreferences = preferences.time_based_preferences[currentHour.toString()]

    if (!timePreferences) return 0.7

    return timePreferences[article.category] || 0.5
  }

  private calculateNoveltyScore(article: NewsArticle, userBehaviors: UserBehavior[], diversityFactor: number): number {
    // Calculate how different this article is from user's recent consumption
    const recentCategories = userBehaviors
      .filter((b) => new Date(b.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000)
      .map((b) => b.category)

    const categoryFreq = recentCategories.filter((cat) => cat === article.category).length
    const totalRecent = recentCategories.length

    if (totalRecent === 0) return 0.5

    const categoryRatio = categoryFreq / totalRecent
    const noveltyScore = 1 - categoryRatio

    return noveltyScore * diversityFactor
  }

  private calculateConfidence(behaviorCount: number, preferencesConfidence: number): number {
    const behaviorConfidence = Math.min(behaviorCount / 100, 1) // Confidence increases with more data
    return (behaviorConfidence + preferencesConfidence) / 2
  }

  private generateExplanation(
    article: NewsArticle,
    contentScore: number,
    demographicScore: number,
    timeRelevance: number,
  ): string {
    const reasons = []

    if (contentScore > 0.7) reasons.push("matches your reading preferences")
    if (demographicScore > 0.7) reasons.push("popular with people like you")
    if (timeRelevance > 0.8) reasons.push("perfect for this time of day")
    if (article.trending_score > 0.8) reasons.push("trending now")

    return reasons.length > 0 ? `Recommended because it ${reasons.join(", ")}` : "Recommended based on your profile"
  }

  private applyDiversityFilter(
    recommendations: RecommendationResult[],
    limit: number,
    diversityFactor: number,
  ): RecommendationResult[] {
    if (diversityFactor < 0.3) {
      return recommendations.slice(0, limit) // Low diversity, just return top scores
    }

    const selected: RecommendationResult[] = []
    const categoryCount: Record<string, number> = {}

    for (const rec of recommendations) {
      if (selected.length >= limit) break

      const category = rec.article.category
      const currentCategoryCount = categoryCount[category] || 0
      const maxPerCategory = Math.ceil(limit / Object.keys(this.categoryKeywords).length)

      if (currentCategoryCount < maxPerCategory || diversityFactor < 0.5) {
        selected.push(rec)
        categoryCount[category] = currentCategoryCount + 1
      }
    }

    // Fill remaining slots if needed
    while (selected.length < limit && selected.length < recommendations.length) {
      const remaining = recommendations.filter((r) => !selected.includes(r))
      if (remaining.length > 0) {
        selected.push(remaining[0])
      } else {
        break
      }
    }

    return selected
  }

  private hasUserSeenArticle(userId: string, articleId: string, behaviors: UserBehavior[]): boolean {
    return behaviors.some((b) => b.user_id === userId && b.article_id === articleId)
  }

  private async findSimilarUsers(
    userId: string,
    userBehaviors: UserBehavior[],
  ): Promise<Array<{ userId: string; similarity: number }>> {
    // Simplified implementation - in production, use proper user-user collaborative filtering
    return []
  }

  private async getUserArticleScore(userId: string, articleId: string): Promise<number> {
    // Simplified implementation - return user's implicit rating for article
    return 0.5
  }

  private categoryKeywords = {
    politics: ["government", "election", "policy"],
    business: ["market", "economy", "stock"],
    technology: ["tech", "ai", "software"],
    sports: ["game", "team", "player"],
    entertainment: ["movie", "music", "celebrity"],
    health: ["health", "medical", "doctor"],
    science: ["research", "study", "scientist"],
    environment: ["climate", "environment", "green"],
  }
}

export const personalizationEngine = new PersonalizationEngine()

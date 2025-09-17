import type {
  UserCredentials,
  UserBehavior,
  UserPreferences,
  NewsArticle,
  RecommendationRequest,
  RecommendationResult,
} from "@/types/user-profile"
import { newsClassifier } from "../mathematical-models/news-classifier"
import { personalizationEngine } from "../mathematical-models/personalization-engine"
import { behavioralAnalyzer } from "../mathematical-models/behavioral-analyzer"
import { coldStartHandler } from "../mathematical-models/cold-start-handler"
import { preferenceManager } from "../data-storage/preference-manager"

/**
 * Unified Recommendation Pipeline
 * Combines all mathematical models into a cohesive system
 */

export class RecommendationPipeline {
  private isInitialized = false
  private globalTrends: Record<string, number> = {}
  private articleCache: Map<string, NewsArticle> = new Map()

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    console.log("Initializing Recommendation Pipeline...")

    try {
      // Load global trends and cache
      await this.loadGlobalTrends()
      await this.preloadPopularArticles()

      this.isInitialized = true
      console.log("Recommendation Pipeline initialized successfully")
    } catch (error) {
      console.error("Error initializing recommendation pipeline:", error)
      throw error
    }
  }

  /**
   * Main recommendation generation method
   * Handles both new and returning users with adaptive pipeline
   */
  async generateRecommendations(request: RecommendationRequest): Promise<{
    recommendations: RecommendationResult[]
    metadata: {
      pipeline_used: "cold_start" | "behavioral" | "hybrid"
      confidence: number
      processing_time: number
      user_segment?: string
      explanation: string
    }
  }> {
    const startTime = Date.now()

    try {
      await this.initialize()

      // Get user data
      const userCredentials = await this.getUserCredentials(request.user_id)
      const userPreferences = await preferenceManager.getUserPreferences(request.user_id)
      const userBehaviors = await preferenceManager.getUserBehaviors(request.user_id, { limit: 1000 })

      // Get available articles
      const availableArticles = await this.getAvailableArticles(request)

      // Classify and enrich articles
      const enrichedArticles = await this.enrichArticles(availableArticles, userCredentials?.location)

      let recommendations: RecommendationResult[]
      let pipelineUsed: "cold_start" | "behavioral" | "hybrid"
      let confidence: number
      let userSegment: string | undefined

      // Determine which pipeline to use
      if (!userCredentials || !userPreferences || userBehaviors.length < 10) {
        // Cold start scenario
        console.log("Using cold start pipeline for user:", request.user_id)

        if (userCredentials) {
          recommendations = await coldStartHandler.generateColdStartRecommendations(
            userCredentials,
            enrichedArticles,
            request.limit,
          )
          userSegment = this.identifyUserSegment(userCredentials)
        } else {
          recommendations = await this.generateAnonymousRecommendations(enrichedArticles, request.limit)
        }

        pipelineUsed = "cold_start"
        confidence = 0.3
      } else if (userBehaviors.length < 50) {
        // Hybrid approach for users with some data
        console.log("Using hybrid pipeline for user:", request.user_id)

        const coldStartRecs = await coldStartHandler.generateColdStartRecommendations(
          userCredentials,
          enrichedArticles,
          Math.ceil(request.limit * 0.4),
        )

        const behavioralRecs = await personalizationEngine.generateRecommendations(
          request,
          userCredentials,
          userPreferences,
          userBehaviors,
          enrichedArticles,
        )

        // Merge and deduplicate
        recommendations = this.mergeRecommendations(coldStartRecs, behavioralRecs, request.limit)
        pipelineUsed = "hybrid"
        confidence = 0.6
        userSegment = this.identifyUserSegment(userCredentials)
      } else {
        // Full behavioral pipeline for experienced users
        console.log("Using behavioral pipeline for user:", request.user_id)

        recommendations = await personalizationEngine.generateRecommendations(
          request,
          userCredentials,
          userPreferences,
          userBehaviors,
          enrichedArticles,
        )

        pipelineUsed = "behavioral"
        confidence = userPreferences.confidence_score
        userSegment = this.identifyUserSegment(userCredentials)
      }

      // Apply final filtering and ranking
      const finalRecommendations = await this.applyFinalFiltering(recommendations, request, userBehaviors)

      const processingTime = Date.now() - startTime

      return {
        recommendations: finalRecommendations,
        metadata: {
          pipeline_used: pipelineUsed,
          confidence,
          processing_time: processingTime,
          user_segment: userSegment,
          explanation: this.generatePipelineExplanation(pipelineUsed, confidence, userSegment),
        },
      }
    } catch (error) {
      console.error("Error in recommendation pipeline:", error)

      // Fallback to simple popularity-based recommendations
      const availableArticles = await this.getAvailableArticles(request)
      const fallbackRecs = this.generateFallbackRecommendations(availableArticles, request.limit)

      return {
        recommendations: fallbackRecs,
        metadata: {
          pipeline_used: "cold_start",
          confidence: 0.1,
          processing_time: Date.now() - startTime,
          explanation: "Fallback recommendations due to system error",
        },
      }
    }
  }

  /**
   * Track user interaction and update models
   */
  async trackInteraction(interaction: {
    user_id: string
    article_id: string
    action: string
    read_duration?: number
    scroll_depth?: number
    device_type?: string
    source?: string
  }): Promise<void> {
    try {
      // Create behavior record
      const behavior: UserBehavior = {
        user_id: interaction.user_id,
        session_id: this.generateSessionId(interaction.user_id),
        article_id: interaction.article_id,
        action: interaction.action as UserBehavior["action"],
        timestamp: new Date().toISOString(),
        time_of_day: new Date().getHours(),
        day_of_week: new Date().getDay(),
        read_duration: interaction.read_duration || 0,
        scroll_depth: interaction.scroll_depth || 0,
        device_type: (interaction.device_type as UserBehavior["device_type"]) || "desktop",
        source: (interaction.source as UserBehavior["source"]) || "recommendation",
        category: await this.getArticleCategory(interaction.article_id),
        sentiment_reaction: this.inferSentimentReaction(interaction.action),
      }

      // Store behavior
      await preferenceManager.storeBehavior(behavior)

      // Update user preferences if enough new data
      await this.maybeUpdatePreferences(interaction.user_id)

      console.log("Interaction tracked successfully:", interaction.action, interaction.article_id)
    } catch (error) {
      console.error("Error tracking interaction:", error)
    }
  }

  /**
   * Batch process multiple users for preference updates
   */
  async batchUpdatePreferences(userIds: string[]): Promise<void> {
    console.log("Starting batch preference update for", userIds.length, "users")

    const batchSize = 10
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize)

      const updatePromises = batch.map(async (userId) => {
        try {
          await this.updateUserPreferences(userId)
        } catch (error) {
          console.error(`Error updating preferences for user ${userId}:`, error)
        }
      })

      await Promise.all(updatePromises)

      // Small delay to prevent overwhelming the system
      if (i + batchSize < userIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    console.log("Batch preference update completed")
  }

  /**
   * Get user insights and analytics
   */
  async getUserInsights(userId: string): Promise<{
    profile_strength: number
    top_categories: Array<{ category: string; score: number }>
    reading_patterns: {
      peak_hours: number[]
      preferred_length: string
      engagement_level: string
    }
    recommendations_performance: {
      click_through_rate: number
      average_read_time: number
      categories_explored: number
    }
    behavioral_trends: {
      consistency_score: number
      diversity_score: number
      recent_changes: string[]
    }
  }> {
    try {
      const userPreferences = await preferenceManager.getUserPreferences(userId)
      const userBehaviors = await preferenceManager.getUserBehaviors(userId, { limit: 500 })

      if (!userPreferences || userBehaviors.length === 0) {
        return this.getDefaultInsights()
      }

      // Analyze behavioral patterns
      const patterns = behavioralAnalyzer.identifyBehavioralPatterns(userBehaviors)

      // Calculate profile strength
      const profileStrength = this.calculateProfileStrength(userPreferences, userBehaviors)

      // Get top categories
      const topCategories = Object.entries(userPreferences.category_weights)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category, score]) => ({ category, score }))

      // Calculate recommendation performance
      const recPerformance = this.calculateRecommendationPerformance(userBehaviors)

      // Analyze behavioral trends
      const behavioralTrends = this.analyzeBehavioralTrends(userBehaviors)

      return {
        profile_strength: profileStrength,
        top_categories: topCategories,
        reading_patterns: {
          peak_hours: patterns.readingRhythm.peakHours,
          preferred_length: patterns.contentPreferences.preferredLength,
          engagement_level: patterns.contentPreferences.engagementLevel,
        },
        recommendations_performance: recPerformance,
        behavioral_trends: behavioralTrends,
      }
    } catch (error) {
      console.error("Error getting user insights:", error)
      return this.getDefaultInsights()
    }
  }

  /**
   * A/B test different recommendation strategies
   */
  async runABTest(testConfig: {
    name: string
    user_groups: Array<{
      group_id: string
      user_ids: string[]
      strategy: "popularity" | "collaborative" | "content_based" | "hybrid"
      parameters: Record<string, any>
    }>
    duration_days: number
    metrics: string[]
  }): Promise<string> {
    console.log("Starting A/B test:", testConfig.name)

    // Store test configuration
    const testId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // In a real implementation, this would:
    // 1. Store test configuration in database
    // 2. Set up tracking for different user groups
    // 3. Apply different recommendation strategies
    // 4. Collect metrics over the test duration
    // 5. Provide statistical analysis of results

    console.log("A/B test started with ID:", testId)
    return testId
  }

  private async loadGlobalTrends(): Promise<void> {
    try {
      const analytics = await preferenceManager.getGlobalAnalytics()

      // Convert category distribution to trends
      const totalBehaviors = Object.values(analytics.categoryDistribution).reduce((sum, count) => sum + count, 0)

      for (const [category, count] of Object.entries(analytics.categoryDistribution)) {
        this.globalTrends[category] = count / totalBehaviors
      }

      console.log("Global trends loaded:", this.globalTrends)
    } catch (error) {
      console.error("Error loading global trends:", error)
      // Set default trends
      this.globalTrends = {
        politics: 0.2,
        business: 0.18,
        technology: 0.15,
        entertainment: 0.12,
        sports: 0.1,
        health: 0.1,
        science: 0.08,
        environment: 0.07,
      }
    }
  }

  private async preloadPopularArticles(): Promise<void> {
    // In a real implementation, this would preload frequently accessed articles
    console.log("Article cache preloaded")
  }

  private async getUserCredentials(userId: string): Promise<UserCredentials | null> {
    // In a real implementation, this would fetch from user database
    // For now, return null to simulate new user
    return null
  }

  private async getAvailableArticles(request: RecommendationRequest): Promise<NewsArticle[]> {
    // In a real implementation, this would fetch from news database
    // For now, return sample articles
    return this.generateSampleArticles(request.limit * 3)
  }

  private async enrichArticles(
    articles: NewsArticle[],
    userLocation?: UserCredentials["location"],
  ): Promise<NewsArticle[]> {
    const enrichedArticles = []

    for (const article of articles) {
      try {
        // Classify category if not already classified
        if (!article.category) {
          const classification = newsClassifier.classifyCategory(article)
          article.category = classification.category
        }

        // Calculate complexity score
        article.complexity_score = newsClassifier.calculateComplexityScore(article)

        // Calculate location relevance
        if (userLocation) {
          const locationRelevance = newsClassifier.calculateLocationRelevance(article, userLocation)
          article.location_relevance.global_relevance = locationRelevance
        }

        enrichedArticles.push(article)
      } catch (error) {
        console.error("Error enriching article:", article.id, error)
        enrichedArticles.push(article) // Include original article
      }
    }

    return enrichedArticles
  }

  private generateSampleArticles(count: number): NewsArticle[] {
    const categories = [
      "politics",
      "business",
      "technology",
      "entertainment",
      "sports",
      "health",
      "science",
      "environment",
    ]
    const sources = ["Reuters", "AP News", "BBC", "CNN", "The Guardian", "Wall Street Journal", "TechCrunch", "ESPN"]

    const articles: NewsArticle[] = []

    for (let i = 0; i < count; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)]
      const source = sources[Math.floor(Math.random() * sources.length)]

      articles.push({
        id: `article_${i}_${Date.now()}`,
        title: `Sample ${category} article ${i + 1}`,
        description: `This is a sample ${category} article for testing the recommendation system.`,
        content: `Detailed content for ${category} article ${i + 1}. This would contain the full article text in a real implementation.`,
        url: `https://example.com/article/${i}`,
        urlToImage: `https://example.com/image/${i}.jpg`,
        publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        source: {
          id: source.toLowerCase().replace(" ", "_"),
          name: source,
          reliability_score: 0.7 + Math.random() * 0.3,
        },
        author: `Author ${i + 1}`,
        category,
        location_relevance: {
          global_relevance: Math.random(),
        },
        sentiment: ["positive", "negative", "neutral"][Math.floor(Math.random() * 3)] as any,
        complexity_score: Math.random(),
        estimated_read_time: Math.floor(Math.random() * 10) + 1,
        keywords: [`keyword${i}`, `${category}`, "news"],
        entities: [`Entity ${i}`, `Organization ${i}`],
        trending_score: Math.random(),
        credibility_score: 0.6 + Math.random() * 0.4,
        engagement_metrics: {
          views: Math.floor(Math.random() * 10000),
          shares: Math.floor(Math.random() * 1000),
          comments: Math.floor(Math.random() * 500),
          likes: Math.floor(Math.random() * 2000),
        },
      })
    }

    return articles
  }

  private async generateAnonymousRecommendations(
    articles: NewsArticle[],
    limit: number,
  ): Promise<RecommendationResult[]> {
    // For anonymous users, use popularity-based recommendations
    const popularArticles = articles
      .sort((a, b) => b.engagement_metrics.views - a.engagement_metrics.views)
      .slice(0, limit)

    return popularArticles.map((article) => ({
      article,
      score: article.engagement_metrics.views / 10000, // Normalize
      reasoning: {
        category_match: 0.5,
        time_relevance: 1.0,
        location_relevance: 0.5,
        behavioral_match: 0.0,
        novelty_score: 0.5,
        overall_confidence: 0.2,
      },
      explanation: "Popular article recommended for anonymous user",
    }))
  }

  private mergeRecommendations(
    coldStartRecs: RecommendationResult[],
    behavioralRecs: RecommendationResult[],
    limit: number,
  ): RecommendationResult[] {
    const merged = new Map<string, RecommendationResult>()

    // Add behavioral recommendations with higher weight
    for (const rec of behavioralRecs) {
      rec.score *= 1.2 // Boost behavioral recommendations
      merged.set(rec.article.id, rec)
    }

    // Add cold start recommendations if not already present
    for (const rec of coldStartRecs) {
      if (!merged.has(rec.article.id)) {
        merged.set(rec.article.id, rec)
      }
    }

    return Array.from(merged.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  private async applyFinalFiltering(
    recommendations: RecommendationResult[],
    request: RecommendationRequest,
    userBehaviors: UserBehavior[],
  ): Promise<RecommendationResult[]> {
    let filtered = [...recommendations]

    // Remove articles user has already seen if requested
    if (request.exclude_seen) {
      const seenArticleIds = new Set(userBehaviors.map((b) => b.article_id))
      filtered = filtered.filter((rec) => !seenArticleIds.has(rec.article.id))
    }

    // Apply category filters if specified
    if (request.categories && request.categories.length > 0) {
      filtered = filtered.filter((rec) => request.categories!.includes(rec.article.category))
    }

    // Apply location filtering if requested
    if (request.location_filter) {
      filtered = filtered.filter((rec) => rec.reasoning.location_relevance > 0.3)
    }

    // Apply diversity boost if specified
    if (request.diversity_boost && request.diversity_boost > 0) {
      filtered = this.applyDiversityBoost(filtered, request.diversity_boost)
    }

    return filtered.slice(0, request.limit)
  }

  private applyDiversityBoost(recommendations: RecommendationResult[], boostFactor: number): RecommendationResult[] {
    const categoryCount: Record<string, number> = {}
    const boosted = []

    for (const rec of recommendations) {
      const category = rec.article.category
      const currentCount = categoryCount[category] || 0

      // Apply diminishing returns for repeated categories
      const diversityPenalty = Math.pow(0.8, currentCount)
      rec.score *= 1 - boostFactor + boostFactor * diversityPenalty

      boosted.push(rec)
      categoryCount[category] = currentCount + 1
    }

    return boosted.sort((a, b) => b.score - a.score)
  }

  private generateFallbackRecommendations(articles: NewsArticle[], limit: number): RecommendationResult[] {
    return articles
      .sort((a, b) => b.trending_score - a.trending_score)
      .slice(0, limit)
      .map((article) => ({
        article,
        score: article.trending_score,
        reasoning: {
          category_match: 0.3,
          time_relevance: 0.5,
          location_relevance: 0.3,
          behavioral_match: 0.0,
          novelty_score: 0.5,
          overall_confidence: 0.1,
        },
        explanation: "Trending article (fallback recommendation)",
      }))
  }

  private generateSessionId(userId: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9)
    return `${userId}_${timestamp}_${random}`
  }

  private async getArticleCategory(articleId: string): Promise<string> {
    // In a real implementation, this would fetch from article database
    const cached = this.articleCache.get(articleId)
    return cached?.category || "general"
  }

  private inferSentimentReaction(action: string): UserBehavior["sentiment_reaction"] {
    switch (action) {
      case "like":
      case "share":
      case "save":
        return "positive"
      case "dislike":
      case "skip":
        return "negative"
      default:
        return "neutral"
    }
  }

  private async maybeUpdatePreferences(userId: string): Promise<void> {
    try {
      // Get recent behaviors (last 24 hours)
      const recentBehaviors = await preferenceManager.getUserBehaviors(userId, {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        limit: 100,
      })

      // Update preferences if user has been active
      if (recentBehaviors.length >= 5) {
        await this.updateUserPreferences(userId)
      }
    } catch (error) {
      console.error("Error in maybeUpdatePreferences:", error)
    }
  }

  private async updateUserPreferences(userId: string): Promise<void> {
    try {
      const currentPreferences = await preferenceManager.getUserPreferences(userId)
      const userBehaviors = await preferenceManager.getUserBehaviors(userId, { limit: 200 })

      if (!currentPreferences || userBehaviors.length === 0) return

      // Use behavioral analyzer to update preferences
      const updatedPreferences = behavioralAnalyzer.updatePreferencesAdaptively(
        currentPreferences,
        userBehaviors,
        0.1, // Learning rate
      )

      await preferenceManager.storePreferences(updatedPreferences)
      console.log("Updated preferences for user:", userId)
    } catch (error) {
      console.error("Error updating user preferences:", error)
    }
  }

  private identifyUserSegment(credentials: UserCredentials): string {
    const age = credentials.age
    const profession = credentials.profession.toLowerCase()

    if (age < 25) return "young_adults"
    if (age < 35 && (profession.includes("engineer") || profession.includes("developer"))) return "tech_professionals"
    if (age < 35) return "young_professionals"
    if (age < 50 && (profession.includes("manager") || profession.includes("director"))) return "executives"
    if (age < 50) return "middle_aged_professionals"
    return "senior_users"
  }

  private generatePipelineExplanation(pipeline: string, confidence: number, userSegment?: string): string {
    const confidenceText = confidence > 0.7 ? "high" : confidence > 0.4 ? "medium" : "low"

    switch (pipeline) {
      case "cold_start":
        return `Using demographic-based recommendations with ${confidenceText} confidence${userSegment ? ` for ${userSegment}` : ""}`
      case "behavioral":
        return `Using personalized recommendations based on your reading history with ${confidenceText} confidence`
      case "hybrid":
        return `Using combined approach mixing your preferences and popular content with ${confidenceText} confidence`
      default:
        return `Using ${pipeline} recommendations with ${confidenceText} confidence`
    }
  }

  private calculateProfileStrength(preferences: UserPreferences, behaviors: UserBehavior[]): number {
    let strength = 0

    // Data quantity factor (0-0.4)
    const behaviorCount = behaviors.length
    strength += Math.min(behaviorCount / 100, 0.4)

    // Preference confidence factor (0-0.3)
    strength += preferences.confidence_score * 0.3

    // Data recency factor (0-0.2)
    const recentBehaviors = behaviors.filter(
      (b) => new Date(b.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
    )
    strength += Math.min(recentBehaviors.length / 20, 0.2)

    // Category diversity factor (0-0.1)
    const uniqueCategories = new Set(behaviors.map((b) => b.category)).size
    strength += Math.min(uniqueCategories / 8, 0.1)

    return Math.min(strength, 1)
  }

  private calculateRecommendationPerformance(behaviors: UserBehavior[]): {
    click_through_rate: number
    average_read_time: number
    categories_explored: number
  } {
    const recommendationBehaviors = behaviors.filter((b) => b.source === "recommendation")

    if (recommendationBehaviors.length === 0) {
      return {
        click_through_rate: 0,
        average_read_time: 0,
        categories_explored: 0,
      }
    }

    const clicks = recommendationBehaviors.filter((b) => b.action === "click" || b.action === "read").length
    const clickThroughRate = clicks / recommendationBehaviors.length

    const readBehaviors = recommendationBehaviors.filter((b) => b.action === "read")
    const averageReadTime =
      readBehaviors.length > 0 ? readBehaviors.reduce((sum, b) => sum + b.read_duration, 0) / readBehaviors.length : 0

    const categoriesExplored = new Set(recommendationBehaviors.map((b) => b.category)).size

    return {
      click_through_rate: clickThroughRate,
      average_read_time: averageReadTime,
      categories_explored: categoriesExplored,
    }
  }

  private analyzeBehavioralTrends(behaviors: UserBehavior[]): {
    consistency_score: number
    diversity_score: number
    recent_changes: string[]
  } {
    if (behaviors.length < 10) {
      return {
        consistency_score: 0,
        diversity_score: 0,
        recent_changes: ["Insufficient data for trend analysis"],
      }
    }

    // Calculate consistency (how regular the user's behavior is)
    const dailyActivity: Record<string, number> = {}
    behaviors.forEach((b) => {
      const date = new Date(b.timestamp).toDateString()
      dailyActivity[date] = (dailyActivity[date] || 0) + 1
    })

    const activityValues = Object.values(dailyActivity)
    const meanActivity = activityValues.reduce((sum, val) => sum + val, 0) / activityValues.length
    const variance =
      activityValues.reduce((sum, val) => sum + Math.pow(val - meanActivity, 2), 0) / activityValues.length
    const consistencyScore = Math.max(0, 1 - variance / (meanActivity * meanActivity))

    // Calculate diversity (how varied the user's interests are)
    const categoryCount: Record<string, number> = {}
    behaviors.forEach((b) => {
      categoryCount[b.category] = (categoryCount[b.category] || 0) + 1
    })

    const totalBehaviors = behaviors.length
    const categoryEntropy = Object.values(categoryCount).reduce((entropy, count) => {
      const probability = count / totalBehaviors
      return entropy - probability * Math.log2(probability)
    }, 0)

    const maxEntropy = Math.log2(Object.keys(categoryCount).length)
    const diversityScore = maxEntropy > 0 ? categoryEntropy / maxEntropy : 0

    // Detect recent changes
    const recentChanges = this.detectRecentChanges(behaviors)

    return {
      consistency_score: consistencyScore,
      diversity_score: diversityScore,
      recent_changes: recentChanges,
    }
  }

  private detectRecentChanges(behaviors: UserBehavior[]): string[] {
    const changes = []
    const recentBehaviors = behaviors.filter(
      (b) => new Date(b.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
    )
    const olderBehaviors = behaviors.filter(
      (b) => new Date(b.timestamp).getTime() <= Date.now() - 7 * 24 * 60 * 60 * 1000,
    )

    if (recentBehaviors.length < 5 || olderBehaviors.length < 5) {
      return ["Insufficient data for change detection"]
    }

    // Compare category preferences
    const recentCategories = this.getCategoryDistribution(recentBehaviors)
    const olderCategories = this.getCategoryDistribution(olderBehaviors)

    for (const [category, recentRatio] of Object.entries(recentCategories)) {
      const olderRatio = olderCategories[category] || 0
      const change = recentRatio - olderRatio

      if (Math.abs(change) > 0.2) {
        if (change > 0) {
          changes.push(`Increased interest in ${category}`)
        } else {
          changes.push(`Decreased interest in ${category}`)
        }
      }
    }

    // Compare reading patterns
    const recentAvgReadTime =
      recentBehaviors.filter((b) => b.action === "read").reduce((sum, b) => sum + b.read_duration, 0) /
      recentBehaviors.filter((b) => b.action === "read").length

    const olderAvgReadTime =
      olderBehaviors.filter((b) => b.action === "read").reduce((sum, b) => sum + b.read_duration, 0) /
      olderBehaviors.filter((b) => b.action === "read").length

    if (Math.abs(recentAvgReadTime - olderAvgReadTime) > 30) {
      if (recentAvgReadTime > olderAvgReadTime) {
        changes.push("Reading articles for longer periods")
      } else {
        changes.push("Reading articles for shorter periods")
      }
    }

    return changes.length > 0 ? changes : ["No significant changes detected"]
  }

  private getCategoryDistribution(behaviors: UserBehavior[]): Record<string, number> {
    const distribution: Record<string, number> = {}
    const total = behaviors.length

    behaviors.forEach((b) => {
      distribution[b.category] = (distribution[b.category] || 0) + 1
    })

    // Convert to ratios
    for (const category in distribution) {
      distribution[category] = distribution[category] / total
    }

    return distribution
  }

  private getDefaultInsights() {
    return {
      profile_strength: 0.1,
      top_categories: [{ category: "general", score: 0.5 }],
      reading_patterns: {
        peak_hours: [9, 14, 20],
        preferred_length: "medium",
        engagement_level: "medium",
      },
      recommendations_performance: {
        click_through_rate: 0,
        average_read_time: 0,
        categories_explored: 0,
      },
      behavioral_trends: {
        consistency_score: 0,
        diversity_score: 0,
        recent_changes: ["New user - no trends available yet"],
      },
    }
  }
}

export const recommendationPipeline = new RecommendationPipeline()

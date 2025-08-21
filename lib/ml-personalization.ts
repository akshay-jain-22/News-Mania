import type { NewsArticle } from "@/types/news"
import type { UserProfile, UserInteraction } from "@/types/personalization"

export class MLPersonalizationEngine {
  private userProfiles: Map<string, UserProfile> = new Map()
  private interactionHistory: Map<string, UserInteraction[]> = new Map()
  private categoryWeights: Map<string, number> = new Map()
  private keywordEmbeddings: Map<string, number[]> = new Map()

  constructor() {
    this.initializeEngine()
  }

  private async initializeEngine() {
    console.log("🤖 Initializing ML Personalization Engine...")

    // Initialize category weights
    this.categoryWeights.set("technology", 1.0)
    this.categoryWeights.set("business", 0.8)
    this.categoryWeights.set("science", 0.9)
    this.categoryWeights.set("health", 0.7)
    this.categoryWeights.set("sports", 0.6)
    this.categoryWeights.set("entertainment", 0.5)
    this.categoryWeights.set("general", 0.4)

    // Load existing user data
    await this.loadUserData()
  }

  /**
   * Track user interaction with an article
   */
  async trackInteraction(
    userId: string,
    articleId: string,
    interactionType: string,
    timeSpent?: number,
    scrollDepth?: number,
  ) {
    try {
      const interaction: UserInteraction = {
        userId,
        articleId,
        interactionType: interactionType as any,
        timestamp: new Date().toISOString(),
        timeSpent: timeSpent || 0,
        scrollDepth: scrollDepth || 0,
        sessionId: this.generateSessionId(),
      }

      // Store interaction
      const userInteractions = this.interactionHistory.get(userId) || []
      userInteractions.push(interaction)
      this.interactionHistory.set(userId, userInteractions)

      // Update user profile
      await this.updateUserProfile(userId, interaction)

      console.log(`📊 Tracked ${interactionType} interaction for user ${userId}`)
    } catch (error) {
      console.error("Error tracking interaction:", error)
    }
  }

  /**
   * Update user profile based on interaction
   */
  private async updateUserProfile(userId: string, interaction: UserInteraction) {
    let profile = this.userProfiles.get(userId)

    if (!profile) {
      profile = this.createNewUserProfile(userId)
    }

    // Update interaction counts
    profile.totalInteractions++
    profile.lastActiveDate = new Date().toISOString()

    // Update category preferences based on interaction
    const article = await this.getArticleById(interaction.articleId)
    if (article) {
      const category = this.extractCategory(article)
      const currentWeight = profile.categoryPreferences.get(category) || 0

      // Calculate new weight based on interaction type and time spent
      const weightIncrease = this.calculateWeightIncrease(interaction)
      profile.categoryPreferences.set(category, currentWeight + weightIncrease)

      // Update keyword preferences
      await this.updateKeywordPreferences(profile, article, weightIncrease)

      // Update reading patterns
      this.updateReadingPatterns(profile, interaction)
    }

    this.userProfiles.set(userId, profile)
  }

  /**
   * Calculate weight increase based on interaction type
   */
  private calculateWeightIncrease(interaction: UserInteraction): number {
    const baseWeights = {
      view: 0.1,
      click: 0.3,
      read: 0.5,
      share: 0.8,
      save: 1.0,
      like: 0.7,
      comment: 0.9,
    }

    let weight = baseWeights[interaction.interactionType] || 0.1

    // Boost weight based on time spent
    if (interaction.timeSpent > 30) weight *= 1.5
    if (interaction.timeSpent > 60) weight *= 2.0
    if (interaction.timeSpent > 120) weight *= 2.5

    // Boost weight based on scroll depth
    if (interaction.scrollDepth > 0.5) weight *= 1.2
    if (interaction.scrollDepth > 0.8) weight *= 1.5

    return weight
  }

  /**
   * Update keyword preferences using NLP
   */
  private async updateKeywordPreferences(profile: UserProfile, article: NewsArticle, weight: number) {
    try {
      // Extract keywords from article
      const keywords = await this.extractKeywords(article)

      keywords.forEach((keyword) => {
        const currentWeight = profile.keywordPreferences.get(keyword) || 0
        profile.keywordPreferences.set(keyword, currentWeight + weight * 0.1)
      })
    } catch (error) {
      console.error("Error updating keyword preferences:", error)
    }
  }

  /**
   * Extract keywords from article using simple NLP
   */
  private async extractKeywords(article: NewsArticle): Promise<string[]> {
    const text = `${article.title} ${article.description} ${article.content}`.toLowerCase()

    // Remove common stop words
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "can",
      "this",
      "that",
      "these",
      "those",
    ])

    // Extract words and filter
    const words = text
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word))

    // Count word frequency
    const wordCount = new Map<string, number>()
    words.forEach((word) => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })

    // Return top keywords
    return Array.from(wordCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }

  /**
   * Update reading patterns
   */
  private updateReadingPatterns(profile: UserProfile, interaction: UserInteraction) {
    const hour = new Date(interaction.timestamp).getHours()
    const currentCount = profile.readingPatterns.timeOfDay.get(hour) || 0
    profile.readingPatterns.timeOfDay.set(hour, currentCount + 1)

    // Update average reading time
    if (interaction.timeSpent > 0) {
      const currentAvg = profile.readingPatterns.averageReadTime
      const totalInteractions = profile.totalInteractions
      profile.readingPatterns.averageReadTime =
        (currentAvg * (totalInteractions - 1) + interaction.timeSpent) / totalInteractions
    }
  }

  /**
   * Generate personalized recommendations using ML
   */
  async generateRecommendations(userId: string, articles: NewsArticle[], maxResults = 10): Promise<NewsArticle[]> {
    try {
      const profile = this.userProfiles.get(userId)
      if (!profile) {
        return this.getColdStartRecommendations(articles, maxResults)
      }

      console.log(`🎯 Generating ML recommendations for user ${userId}`)

      // Score articles based on user preferences
      const scoredArticles = await Promise.all(
        articles.map(async (article) => {
          const score = await this.calculatePersonalizationScore(profile, article)
          return { article, score }
        }),
      )

      // Sort by score and apply diversity filter
      const sortedArticles = scoredArticles.sort((a, b) => b.score - a.score).slice(0, maxResults * 2) // Get more than needed for diversity filtering

      // Apply diversity filtering
      const diverseArticles = this.applyDiversityFilter(sortedArticles, maxResults)

      console.log(`✨ Generated ${diverseArticles.length} personalized recommendations`)
      return diverseArticles.map((item) => item.article)
    } catch (error) {
      console.error("Error generating recommendations:", error)
      return this.getColdStartRecommendations(articles, maxResults)
    }
  }

  /**
   * Calculate personalization score for an article
   */
  private async calculatePersonalizationScore(profile: UserProfile, article: NewsArticle): Promise<number> {
    let score = 0

    // Category preference score (40% weight)
    const category = this.extractCategory(article)
    const categoryPreference = profile.categoryPreferences.get(category) || 0
    score += categoryPreference * 0.4

    // Keyword matching score (30% weight)
    const keywords = await this.extractKeywords(article)
    let keywordScore = 0
    keywords.forEach((keyword) => {
      const preference = profile.keywordPreferences.get(keyword) || 0
      keywordScore += preference
    })
    score += (keywordScore / keywords.length) * 0.3

    // Recency score (15% weight)
    const hoursAgo = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60)
    const recencyScore = Math.max(0, 1 - hoursAgo / 48) // Decay over 48 hours
    score += recencyScore * 0.15

    // Source credibility score (10% weight)
    const credibilityScore = (article.credibilityScore || 70) / 100
    score += credibilityScore * 0.1

    // Time-based preference (5% weight)
    const currentHour = new Date().getHours()
    const timePreference = profile.readingPatterns.timeOfDay.get(currentHour) || 0
    const maxTimePreference = Math.max(...Array.from(profile.readingPatterns.timeOfDay.values()))
    const timeScore = maxTimePreference > 0 ? timePreference / maxTimePreference : 0.5
    score += timeScore * 0.05

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Apply diversity filtering to avoid echo chambers
   */
  private applyDiversityFilter(scoredArticles: { article: NewsArticle; score: number }[], maxResults: number) {
    const selected: { article: NewsArticle; score: number }[] = []
    const categoryCount = new Map<string, number>()

    for (const item of scoredArticles) {
      if (selected.length >= maxResults) break

      const category = this.extractCategory(item.article)
      const currentCount = categoryCount.get(category) || 0
      const maxPerCategory = Math.ceil(maxResults / 3) // Max 1/3 from same category

      if (currentCount < maxPerCategory) {
        selected.push(item)
        categoryCount.set(category, currentCount + 1)
      }
    }

    // Fill remaining slots if needed
    for (const item of scoredArticles) {
      if (selected.length >= maxResults) break
      if (!selected.includes(item)) {
        selected.push(item)
      }
    }

    return selected.slice(0, maxResults)
  }

  /**
   * Generate LLM-enhanced personalized headlines
   */
  async generatePersonalizedHeadline(userId: string, article: NewsArticle): Promise<string> {
    try {
      const profile = this.userProfiles.get(userId)
      if (!profile) return article.title

      // Get user's top interests
      const topCategories = Array.from(profile.categoryPreferences.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category)

      const topKeywords = Array.from(profile.keywordPreferences.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([keyword]) => keyword)

      // Call LLM API to personalize headline
      const response = await fetch("/api/personalize-headline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalTitle: article.title,
          userCategories: topCategories,
          userKeywords: topKeywords,
          readingLevel: profile.readingPatterns.averageReadTime > 60 ? "detailed" : "quick",
        }),
      })

      if (response.ok) {
        const { personalizedHeadline } = await response.json()
        return personalizedHeadline || article.title
      }

      return article.title
    } catch (error) {
      console.error("Error generating personalized headline:", error)
      return article.title
    }
  }

  /**
   * Get user insights and analytics
   */
  getUserInsights(userId: string) {
    const profile = this.userProfiles.get(userId)
    const interactions = this.interactionHistory.get(userId) || []

    if (!profile) {
      return {
        totalInteractions: 0,
        topCategories: [],
        topKeywords: [],
        readingPatterns: {},
        engagementScore: 0,
      }
    }

    const topCategories = Array.from(profile.categoryPreferences.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    const topKeywords = Array.from(profile.keywordPreferences.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)

    const engagementScore = this.calculateEngagementScore(profile, interactions)

    return {
      totalInteractions: profile.totalInteractions,
      topCategories,
      topKeywords,
      readingPatterns: {
        averageReadTime: profile.readingPatterns.averageReadTime,
        peakHours: this.getPeakReadingHours(profile),
        consistency: this.calculateReadingConsistency(interactions),
      },
      engagementScore,
    }
  }

  // Helper methods
  private createNewUserProfile(userId: string): UserProfile {
    return {
      userId,
      categoryPreferences: new Map(),
      keywordPreferences: new Map(),
      readingPatterns: {
        timeOfDay: new Map(),
        averageReadTime: 0,
        preferredLength: "medium",
      },
      totalInteractions: 0,
      lastActiveDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
  }

  private extractCategory(article: NewsArticle): string {
    // Extract category from source name or content
    const sourceName = article.source.name.toLowerCase()

    if (sourceName.includes("tech") || sourceName.includes("digital")) return "technology"
    if (sourceName.includes("business") || sourceName.includes("financial")) return "business"
    if (sourceName.includes("health") || sourceName.includes("medical")) return "health"
    if (sourceName.includes("sports") || sourceName.includes("athletic")) return "sports"
    if (sourceName.includes("entertainment") || sourceName.includes("celebrity")) return "entertainment"
    if (sourceName.includes("science") || sourceName.includes("research")) return "science"

    return "general"
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async getArticleById(articleId: string): Promise<NewsArticle | null> {
    // This would typically fetch from your article storage
    return null
  }

  private getColdStartRecommendations(articles: NewsArticle[], maxResults: number): NewsArticle[] {
    // For new users, return trending/popular articles
    return articles.sort((a, b) => (b.credibilityScore || 0) - (a.credibilityScore || 0)).slice(0, maxResults)
  }

  private calculateEngagementScore(profile: UserProfile, interactions: UserInteraction[]): number {
    if (interactions.length === 0) return 0

    const recentInteractions = interactions.filter(
      (i) => Date.now() - new Date(i.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000, // Last 7 days
    )

    const avgTimeSpent = recentInteractions.reduce((sum, i) => sum + i.timeSpent, 0) / recentInteractions.length
    const interactionVariety = new Set(recentInteractions.map((i) => i.interactionType)).size

    return Math.min(100, (avgTimeSpent / 60) * 20 + interactionVariety * 10 + recentInteractions.length * 2)
  }

  private getPeakReadingHours(profile: UserProfile): number[] {
    const hourCounts = Array.from(profile.readingPatterns.timeOfDay.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => hour)

    return hourCounts
  }

  private calculateReadingConsistency(interactions: UserInteraction[]): number {
    if (interactions.length < 7) return 0

    const dailyInteractions = new Map<string, number>()
    interactions.forEach((interaction) => {
      const date = new Date(interaction.timestamp).toDateString()
      dailyInteractions.set(date, (dailyInteractions.get(date) || 0) + 1)
    })

    const days = Array.from(dailyInteractions.values())
    const avg = days.reduce((sum, count) => sum + count, 0) / days.length
    const variance = days.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / days.length

    return Math.max(0, 100 - Math.sqrt(variance) * 10)
  }

  private async loadUserData() {
    // Load user profiles and interactions from storage/database
    // This would typically connect to your database
  }
}

// Export singleton instance
export const mlPersonalizationEngine = new MLPersonalizationEngine()

import type { NewsArticle } from "@/types/news"
import type {
  UserProfile,
  ArticleEmbedding,
  UserEmbedding,
  RecommendationResult,
  RecommendationRequest,
  PersonalizedFeed,
} from "@/types/recommendations"

export class NewsRecommendationEngine {
  private userProfiles: Map<string, UserProfile> = new Map()
  private articleEmbeddings: Map<string, ArticleEmbedding> = new Map()
  private userEmbeddings: Map<string, UserEmbedding> = new Map()

  constructor() {
    this.initializeEngine()
  }

  private async initializeEngine() {
    console.log("Initializing News Recommendation Engine...")
    // Load existing user profiles and embeddings from storage
    await this.loadUserProfiles()
    await this.loadArticleEmbeddings()
  }

  /**
   * Generate embeddings for an article using OpenAI or local model
   */
  async generateArticleEmbedding(article: NewsArticle): Promise<ArticleEmbedding> {
    try {
      // Combine title, description, and content for embedding
      const text = `${article.title} ${article.description} ${article.content}`.slice(0, 8000)

      // Use OpenAI embeddings API
      const response = await fetch("/api/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type: "article" }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate embedding")
      }

      const { embedding, keywords, sentiment } = await response.json()

      const articleEmbedding: ArticleEmbedding = {
        articleId: article.id,
        embedding,
        category: this.extractCategory(article),
        keywords: keywords || this.extractKeywords(text),
        sentiment: sentiment || 0,
        popularity: this.calculatePopularity(article),
        publishedAt: article.publishedAt,
      }

      this.articleEmbeddings.set(article.id, articleEmbedding)
      return articleEmbedding
    } catch (error) {
      console.error("Error generating article embedding:", error)
      // Fallback to simple keyword-based embedding
      return this.generateFallbackEmbedding(article)
    }
  }

  /**
   * Generate user embedding based on their reading history and preferences
   */
  async generateUserEmbedding(userProfile: UserProfile): Promise<UserEmbedding> {
    try {
      // Get embeddings of articles the user has interacted with
      const readArticleEmbeddings = userProfile.readArticles
        .map((articleId) => this.articleEmbeddings.get(articleId))
        .filter(Boolean) as ArticleEmbedding[]

      if (readArticleEmbeddings.length === 0) {
        // New user - create embedding based on preferences
        return this.generateNewUserEmbedding(userProfile)
      }

      // Weight embeddings based on user actions and time spent
      const weightedEmbedding = this.calculateWeightedEmbedding(readArticleEmbeddings, userProfile.clickHistory)

      const userEmbedding: UserEmbedding = {
        userId: userProfile.userId,
        embedding: weightedEmbedding,
        lastUpdated: new Date().toISOString(),
        confidence: this.calculateConfidence(userProfile),
      }

      this.userEmbeddings.set(userProfile.userId, userEmbedding)
      return userEmbedding
    } catch (error) {
      console.error("Error generating user embedding:", error)
      return this.generateFallbackUserEmbedding(userProfile)
    }
  }

  /**
   * Get personalized recommendations for a user
   */
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResult[]> {
    const userProfile = this.userProfiles.get(request.userId)
    if (!userProfile) {
      return this.getColdStartRecommendations(request)
    }

    const userEmbedding = await this.getUserEmbedding(request.userId)
    const availableArticles = await this.getAvailableArticles(request)

    const recommendations: RecommendationResult[] = []

    for (const article of availableArticles) {
      const articleEmbedding = this.articleEmbeddings.get(article.id)
      if (!articleEmbedding) continue

      const score = this.calculateRecommendationScore(userProfile, userEmbedding, article, articleEmbedding)

      if (score > 0.3) {
        // Threshold for relevance
        recommendations.push({
          articleId: article.id,
          score,
          reason: this.generateRecommendationReason(userProfile, article, score),
          category: articleEmbedding.category,
          confidence: this.calculateRecommendationConfidence(score, userEmbedding.confidence),
        })
      }
    }

    // Sort by score and return top N
    return recommendations.sort((a, b) => b.score - a.score).slice(0, request.maxResults || 10)
  }

  /**
   * Generate personalized feed with custom headlines
   */
  async generatePersonalizedFeed(userId: string): Promise<PersonalizedFeed> {
    const recommendations = await this.getRecommendations({
      userId,
      maxResults: 15,
      excludeReadArticles: true,
    })

    // Generate personalized headlines for top articles
    const enhancedRecommendations = await Promise.all(
      recommendations.map(async (rec) => ({
        ...rec,
        personalizedHeadline: await this.generatePersonalizedHeadline(userId, rec.articleId),
      })),
    )

    const personalizedMessage = await this.generatePersonalizedMessage(userId, recommendations)

    return {
      userId,
      recommendations: enhancedRecommendations,
      personalizedMessage,
      lastUpdated: new Date().toISOString(),
      feedType: "personalized",
    }
  }

  /**
   * Update user profile based on interactions
   */
  async updateUserProfile(userId: string, action: string, articleId: string, timeSpent?: number) {
    let userProfile = this.userProfiles.get(userId)

    if (!userProfile) {
      userProfile = this.createNewUserProfile(userId)
    }

    // Update click history
    userProfile.clickHistory.push({
      articleId,
      timestamp: new Date().toISOString(),
      action: action as any,
      timeSpent,
      category: this.getArticleCategory(articleId),
    })

    // Update read articles if user spent significant time
    if (action === "read" || (timeSpent && timeSpent > 30)) {
      if (!userProfile.readArticles.includes(articleId)) {
        userProfile.readArticles.push(articleId)
      }
    }

    // Update category preferences
    const category = this.getArticleCategory(articleId)
    if (category) {
      userProfile.timeSpentOnCategories[category] =
        (userProfile.timeSpentOnCategories[category] || 0) + (timeSpent || 1)
    }

    userProfile.lastActiveDate = new Date().toISOString()
    this.userProfiles.set(userId, userProfile)

    // Regenerate user embedding
    await this.generateUserEmbedding(userProfile)
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    if (normA === 0 || normB === 0) return 0
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  /**
   * Calculate recommendation score combining multiple factors
   */
  private calculateRecommendationScore(
    userProfile: UserProfile,
    userEmbedding: UserEmbedding,
    article: NewsArticle,
    articleEmbedding: ArticleEmbedding,
  ): number {
    // Semantic similarity (40% weight)
    const semanticScore = this.cosineSimilarity(userEmbedding.embedding, articleEmbedding.embedding)

    // Category preference (25% weight)
    const categoryScore = userProfile.preferredCategories.includes(articleEmbedding.category) ? 1 : 0.3

    // Recency score (20% weight)
    const recencyScore = this.calculateRecencyScore(article.publishedAt)

    // Popularity score (10% weight)
    const popularityScore = Math.min(articleEmbedding.popularity / 100, 1)

    // Diversity score (5% weight) - avoid too similar articles
    const diversityScore = this.calculateDiversityScore(userProfile, articleEmbedding.category)

    const finalScore =
      semanticScore * 0.4 + categoryScore * 0.25 + recencyScore * 0.2 + popularityScore * 0.1 + diversityScore * 0.05

    return Math.max(0, Math.min(1, finalScore))
  }

  /**
   * Generate personalized headline using LLM
   */
  private async generatePersonalizedHeadline(userId: string, articleId: string): Promise<string> {
    try {
      const userProfile = this.userProfiles.get(userId)
      const article = await this.getArticleById(articleId)

      if (!userProfile || !article) return article?.title || ""

      const response = await fetch("/api/personalize-headline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalTitle: article.title,
          userInterests: userProfile.interests,
          preferredCategories: userProfile.preferredCategories,
          readingHistory: userProfile.readArticles.slice(-5), // Last 5 articles
        }),
      })

      if (response.ok) {
        const { personalizedHeadline } = await response.json()
        return personalizedHeadline || article.title
      }

      return article.title
    } catch (error) {
      console.error("Error generating personalized headline:", error)
      const article = await this.getArticleById(articleId)
      return article?.title || ""
    }
  }

  /**
   * Generate personalized intro message
   */
  private async generatePersonalizedMessage(userId: string, recommendations: RecommendationResult[]): Promise<string> {
    try {
      const userProfile = this.userProfiles.get(userId)
      if (!userProfile) return "Here are some news articles you might find interesting:"

      const topCategories = Object.entries(userProfile.timeSpentOnCategories)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category)

      const response = await fetch("/api/personalize-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topCategories,
          recommendationCount: recommendations.length,
          userInterests: userProfile.interests,
          timeOfDay: new Date().getHours(),
        }),
      })

      if (response.ok) {
        const { message } = await response.json()
        return message
      }

      return this.generateFallbackMessage(topCategories)
    } catch (error) {
      console.error("Error generating personalized message:", error)
      return "Here are some news articles tailored for you:"
    }
  }

  // Helper methods
  private generateFallbackMessage(categories: string[]): string {
    const timeOfDay = new Date().getHours()
    const greeting = timeOfDay < 12 ? "Good morning" : timeOfDay < 18 ? "Good afternoon" : "Good evening"

    if (categories.length > 0) {
      return `${greeting}! Here's the latest on ${categories[0]} and other topics you follow:`
    }

    return `${greeting}! Here are today's top stories:`
  }

  private calculateRecencyScore(publishedAt: string): number {
    const now = new Date().getTime()
    const published = new Date(publishedAt).getTime()
    const hoursSincePublished = (now - published) / (1000 * 60 * 60)

    // Score decreases over time, but slowly
    return Math.max(0.1, Math.exp(-hoursSincePublished / 24))
  }

  private calculateDiversityScore(userProfile: UserProfile, category: string): number {
    const recentCategories = userProfile.clickHistory.slice(-10).map((click) => click.category)

    const categoryCount = recentCategories.filter((cat) => cat === category).length
    return Math.max(0.3, 1 - categoryCount / 10)
  }

  private extractCategory(article: NewsArticle): string {
    // Extract category from article ID or content analysis
    const idParts = article.id.split("-")
    return idParts[0] || "general"
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction (in production, use NLP libraries)
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 3)

    const wordCount = new Map<string, number>()
    words.forEach((word) => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })

    return Array.from(wordCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }

  private calculatePopularity(article: NewsArticle): number {
    // Simple popularity calculation (in production, use real metrics)
    return Math.random() * 100
  }

  private generateFallbackEmbedding(article: NewsArticle): ArticleEmbedding {
    // Generate simple embedding based on keywords
    const text = `${article.title} ${article.description}`.toLowerCase()
    const embedding = new Array(384).fill(0).map(() => Math.random() - 0.5)

    return {
      articleId: article.id,
      embedding,
      category: this.extractCategory(article),
      keywords: this.extractKeywords(text),
      sentiment: 0,
      popularity: this.calculatePopularity(article),
      publishedAt: article.publishedAt,
    }
  }

  private async getUserEmbedding(userId: string): Promise<UserEmbedding> {
    let userEmbedding = this.userEmbeddings.get(userId)

    if (!userEmbedding) {
      const userProfile = this.userProfiles.get(userId)
      if (userProfile) {
        userEmbedding = await this.generateUserEmbedding(userProfile)
      } else {
        // Create default embedding for new user
        userEmbedding = {
          userId,
          embedding: new Array(384).fill(0),
          lastUpdated: new Date().toISOString(),
          confidence: 0.1,
        }
      }
    }

    return userEmbedding
  }

  private generateRecommendationReason(userProfile: UserProfile, article: NewsArticle, score: number): string {
    const category = this.extractCategory(article)

    if (userProfile.preferredCategories.includes(category)) {
      return `Based on your interest in ${category}`
    }

    if (score > 0.8) {
      return "Highly relevant to your reading patterns"
    }

    if (score > 0.6) {
      return "Similar to articles you've enjoyed"
    }

    return "Trending in your areas of interest"
  }

  private calculateConfidence(userProfile: UserProfile): number {
    const historyLength = userProfile.clickHistory.length
    const categoryDiversity = Object.keys(userProfile.timeSpentOnCategories).length

    return Math.min(1, (historyLength / 50) * (categoryDiversity / 5))
  }

  private calculateRecommendationConfidence(score: number, userConfidence: number): number {
    return score * userConfidence
  }

  // Placeholder methods for data loading/saving
  private async loadUserProfiles() {
    // Load from database or storage
  }

  private async loadArticleEmbeddings() {
    // Load from database or storage
  }

  private createNewUserProfile(userId: string): UserProfile {
    return {
      userId,
      preferredCategories: ["general"],
      readArticles: [],
      clickHistory: [],
      searchHistory: [],
      timeSpentOnCategories: {},
      lastActiveDate: new Date().toISOString(),
      interests: [],
      dislikedTopics: [],
    }
  }

  private getArticleCategory(articleId: string): string {
    const embedding = this.articleEmbeddings.get(articleId)
    return embedding?.category || "general"
  }

  private async getArticleById(articleId: string): Promise<NewsArticle | null> {
    // Fetch article from your news API or database
    return null
  }

  private async getAvailableArticles(request: RecommendationRequest): Promise<NewsArticle[]> {
    // Fetch available articles based on request criteria
    return []
  }

  private getColdStartRecommendations(request: RecommendationRequest): RecommendationResult[] {
    // Return popular/trending articles for new users
    return []
  }

  private generateNewUserEmbedding(userProfile: UserProfile): UserEmbedding {
    // Generate embedding based on preferred categories
    const embedding = new Array(384).fill(0).map(() => Math.random() - 0.5)

    return {
      userId: userProfile.userId,
      embedding,
      lastUpdated: new Date().toISOString(),
      confidence: 0.2,
    }
  }

  private generateFallbackUserEmbedding(userProfile: UserProfile): UserEmbedding {
    return this.generateNewUserEmbedding(userProfile)
  }

  private calculateWeightedEmbedding(embeddings: ArticleEmbedding[], clickHistory: any[]): number[] {
    if (embeddings.length === 0) return new Array(384).fill(0)

    const weightedSum = new Array(384).fill(0)
    let totalWeight = 0

    embeddings.forEach((embedding, index) => {
      const weight = 1 + index * 0.1 // More recent articles get higher weight
      totalWeight += weight

      embedding.embedding.forEach((value, i) => {
        weightedSum[i] += value * weight
      })
    })

    return weightedSum.map((sum) => sum / totalWeight)
  }
}

// Export singleton instance
export const recommendationEngine = new NewsRecommendationEngine()

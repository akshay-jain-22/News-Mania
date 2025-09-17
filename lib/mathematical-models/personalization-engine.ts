import type { UserProfile, NewsArticle, RecommendationScore } from "@/types/user-profile"

export class PersonalizationEngine {
  /**
   * Collaborative Filtering using Matrix Factorization
   */
  async collaborativeFiltering(
    userId: string,
    articles: NewsArticle[],
    userInteractions: Map<string, number>,
  ): Promise<RecommendationScore[]> {
    const scores: RecommendationScore[] = []

    // Simplified collaborative filtering
    for (const article of articles) {
      let score = 0
      let confidence = 0.5

      // Find similar users based on interaction patterns
      const similarityScore = await this.calculateUserSimilarity(userId, article.category)

      // Calculate recommendation score
      score = similarityScore * 0.7 + (userInteractions.get(article.category) || 0) * 0.3
      confidence = Math.min(similarityScore + 0.2, 1.0)

      scores.push({
        articleId: article.id,
        score: Math.max(0, Math.min(score, 1)),
        reasons: ["Similar users liked this content"],
        confidence,
        pipeline: "collaborative",
      })
    }

    return scores.sort((a, b) => b.score - a.score)
  }

  /**
   * Content-Based Filtering using TF-IDF and Cosine Similarity
   */
  contentBasedFiltering(userProfile: UserProfile, articles: NewsArticle[]): RecommendationScore[] {
    const scores: RecommendationScore[] = []

    // Create user preference vector
    const userVector = this.createUserPreferenceVector(userProfile)

    for (const article of articles) {
      // Create article feature vector
      const articleVector = this.createArticleVector(article)

      // Calculate cosine similarity
      const similarity = this.cosineSimilarity(userVector, articleVector)

      // Apply category preference boost
      const categoryBoost = this.getCategoryPreference(userProfile, article.category)

      const finalScore = similarity * 0.7 + categoryBoost * 0.3

      scores.push({
        articleId: article.id,
        score: Math.max(0, Math.min(finalScore, 1)),
        reasons: [`Content matches your interests in ${article.category}`],
        confidence: similarity,
        pipeline: "content",
      })
    }

    return scores.sort((a, b) => b.score - a.score)
  }

  /**
   * Demographic-Based Filtering
   */
  demographicFiltering(userProfile: UserProfile, articles: NewsArticle[]): RecommendationScore[] {
    const scores: RecommendationScore[] = []

    // Age-based preferences
    const agePreferences = this.getAgeBasedPreferences(userProfile.age)

    // Profession-based preferences
    const professionPreferences = this.getProfessionBasedPreferences(userProfile.profession)

    // Location-based preferences
    const locationPreferences = this.getLocationBasedPreferences(userProfile.location.country)

    for (const article of articles) {
      let score = 0
      const reasons: string[] = []

      // Age factor
      if (agePreferences.includes(article.category)) {
        score += 0.3
        reasons.push(`Popular with your age group`)
      }

      // Profession factor
      if (professionPreferences.includes(article.category)) {
        score += 0.4
        reasons.push(`Relevant to your profession`)
      }

      // Location factor
      if (locationPreferences.includes(article.category) || article.location?.includes(userProfile.location.country)) {
        score += 0.3
        reasons.push(`Local or regional relevance`)
      }

      scores.push({
        articleId: article.id,
        score: Math.max(0, Math.min(score, 1)),
        reasons,
        confidence: 0.6,
        pipeline: "demographic",
      })
    }

    return scores.sort((a, b) => b.score - a.score)
  }

  /**
   * Hybrid Recommendation System
   */
  hybridRecommendation(
    userProfile: UserProfile,
    articles: NewsArticle[],
    userInteractions: Map<string, number>,
  ): Promise<RecommendationScore[]> {
    return new Promise(async (resolve) => {
      // Get scores from all methods
      const collaborativeScores = await this.collaborativeFiltering(userProfile.id, articles, userInteractions)
      const contentScores = this.contentBasedFiltering(userProfile, articles)
      const demographicScores = this.demographicFiltering(userProfile, articles)

      // Combine scores with weights
      const hybridScores: RecommendationScore[] = []

      for (const article of articles) {
        const collabScore = collaborativeScores.find((s) => s.articleId === article.id)?.score || 0
        const contentScore = contentScores.find((s) => s.articleId === article.id)?.score || 0
        const demoScore = demographicScores.find((s) => s.articleId === article.id)?.score || 0

        // Weighted combination
        const finalScore = collabScore * 0.4 + contentScore * 0.4 + demoScore * 0.2

        // Combine reasons
        const allReasons = [
          ...(collaborativeScores.find((s) => s.articleId === article.id)?.reasons || []),
          ...(contentScores.find((s) => s.articleId === article.id)?.reasons || []),
          ...(demographicScores.find((s) => s.articleId === article.id)?.reasons || []),
        ]

        hybridScores.push({
          articleId: article.id,
          score: finalScore,
          reasons: [...new Set(allReasons)],
          confidence: (collabScore + contentScore + demoScore) / 3,
          pipeline: "collaborative",
        })
      }

      resolve(hybridScores.sort((a, b) => b.score - a.score))
    })
  }

  private async calculateUserSimilarity(userId: string, category: string): Promise<number> {
    // Simplified similarity calculation
    // In a real implementation, this would use actual user interaction data
    return Math.random() * 0.8 + 0.1 // Random similarity between 0.1 and 0.9
  }

  private createUserPreferenceVector(userProfile: UserProfile): number[] {
    const categories = ["politics", "sports", "entertainment", "business", "technology", "health", "science", "world"]
    return categories.map((category) => {
      const preference = userProfile.behaviorProfile.categoryPreferences.find((cp) => cp.category === category)
      return preference ? preference.score : 0.1
    })
  }

  private createArticleVector(article: NewsArticle): number[] {
    const categories = ["politics", "sports", "entertainment", "business", "technology", "health", "science", "world"]
    return categories.map((category) => {
      return article.category === category ? 1 : 0
    })
  }

  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0)
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0))
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0))

    if (magnitudeA === 0 || magnitudeB === 0) return 0
    return dotProduct / (magnitudeA * magnitudeB)
  }

  private getCategoryPreference(userProfile: UserProfile, category: string): number {
    const preference = userProfile.behaviorProfile.categoryPreferences.find((cp) => cp.category === category)
    return preference ? preference.score : 0.1
  }

  private getAgeBasedPreferences(age: number): string[] {
    if (age < 25) return ["technology", "entertainment", "sports"]
    if (age < 40) return ["business", "technology", "health"]
    if (age < 60) return ["politics", "business", "health"]
    return ["politics", "health", "world"]
  }

  private getProfessionBasedPreferences(profession: string): string[] {
    const professionMap: Record<string, string[]> = {
      engineer: ["technology", "science", "business"],
      doctor: ["health", "science", "world"],
      teacher: ["education", "politics", "world"],
      business: ["business", "politics", "technology"],
      student: ["technology", "entertainment", "sports"],
      default: ["world", "politics", "business"],
    }

    return professionMap[profession.toLowerCase()] || professionMap["default"]
  }

  private getLocationBasedPreferences(country: string): string[] {
    // Simplified location-based preferences
    const locationMap: Record<string, string[]> = {
      US: ["politics", "business", "sports"],
      UK: ["politics", "business", "world"],
      India: ["technology", "business", "politics"],
      default: ["world", "politics", "business"],
    }

    return locationMap[country] || locationMap["default"]
  }
}

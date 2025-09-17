import type { UserProfile, NewsArticle, RecommendationScore } from "@/types/user-profile"
import { generateText } from "ai"
import { xai } from "@ai-sdk/xai"

export class ColdStartHandler {
  /**
   * Demographic-based inference for new users
   */
  generateDemographicProfile(
    age: number,
    profession: string,
    gender: string,
    location: string,
  ): {
    preferredCategories: string[]
    readingLevel: "basic" | "intermediate" | "advanced"
    contentLength: "short" | "medium" | "long" | "mixed"
    confidence: number
  } {
    const preferredCategories = this.inferCategoriesFromDemographics(age, profession, gender, location)

    const readingLevel = this.inferReadingLevel(age, profession)
    const contentLength = this.inferContentLength(age, profession)

    // Confidence based on how specific the demographic data is
    const confidence = this.calculateDemographicConfidence(age, profession, gender, location)

    return {
      preferredCategories,
      readingLevel,
      contentLength,
      confidence,
    }
  }

  /**
   * LLM-based preference inference
   */
  async generateLLMBasedPreferences(userProfile: Partial<UserProfile>): Promise<{
    categories: string[]
    reasoning: string
    timePreferences: string[]
    confidence: number
  }> {
    try {
      const prompt = `
        Based on the following user profile, predict their news reading preferences:
        - Age: ${userProfile.age}
        - Profession: ${userProfile.profession}
        - Gender: ${userProfile.gender}
        - Location: ${userProfile.location?.country}, ${userProfile.location?.city}
        
        Available categories: politics, sports, entertainment, business, technology, health, science, world
        
        Provide:
        1. Top 3-5 preferred categories
        2. Brief reasoning for each choice
        3. Preferred reading times (morning, afternoon, evening, night)
        4. Confidence level (0-1)
        
        Format as JSON with keys: categories, reasoning, timePreferences, confidence
      `

      const { text } = await generateText({
        model: xai("grok-beta"),
        prompt,
        maxTokens: 500,
      })

      const result = JSON.parse(text)
      return {
        categories: result.categories || ["world", "politics", "business"],
        reasoning: result.reasoning || "General interest prediction",
        timePreferences: result.timePreferences || ["morning", "evening"],
        confidence: Math.min(result.confidence || 0.6, 1.0),
      }
    } catch (error) {
      console.error("LLM preference generation failed:", error)

      // Fallback to demographic inference
      const demographic = this.generateDemographicProfile(
        userProfile.age || 30,
        userProfile.profession || "professional",
        userProfile.gender || "prefer_not_to_say",
        userProfile.location?.country || "US",
      )

      return {
        categories: demographic.preferredCategories,
        reasoning: "Fallback demographic-based prediction",
        timePreferences: ["morning", "evening"],
        confidence: demographic.confidence,
      }
    }
  }

  /**
   * Generalized trend-based recommendations
   */
  generateTrendBasedRecommendations(articles: NewsArticle[], userLocation?: string): RecommendationScore[] {
    const scores: RecommendationScore[] = []

    // Global trending topics (simulated)
    const trendingTopics = ["technology", "politics", "health", "business"]
    const trendingKeywords = ["ai", "election", "covid", "market", "climate"]

    for (const article of articles) {
      let score = 0.3 // Base score for new users
      const reasons: string[] = []

      // Trending category bonus
      if (trendingTopics.includes(article.category)) {
        score += 0.3
        reasons.push("Trending topic")
      }

      // Trending keyword bonus
      const articleText = `${article.title} ${article.content}`.toLowerCase()
      for (const keyword of trendingKeywords) {
        if (articleText.includes(keyword)) {
          score += 0.2
          reasons.push(`Contains trending keyword: ${keyword}`)
          break
        }
      }

      // Location relevance
      if (userLocation && article.location?.includes(userLocation)) {
        score += 0.2
        reasons.push("Local relevance")
      }

      // Recency bonus
      const hoursOld = (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60)
      if (hoursOld < 24) {
        score += 0.1
        reasons.push("Recent news")
      }

      scores.push({
        articleId: article.id,
        score: Math.min(score, 1.0),
        reasons,
        confidence: 0.4,
        pipeline: "cold_start",
      })
    }

    return scores.sort((a, b) => b.score - a.score)
  }

  /**
   * Progressive learning for new users
   */
  createProgressiveLearningPlan(userProfile: UserProfile): {
    phase1: string[] // First week categories
    phase2: string[] // Second week categories
    phase3: string[] // Third week categories
    diversificationStrategy: string
  } {
    const baseCategories = userProfile.preferences.categories

    // Phase 1: Focus on stated preferences
    const phase1 = baseCategories.slice(0, 3)

    // Phase 2: Add related categories
    const phase2 = [...phase1, ...this.getRelatedCategories(baseCategories)].slice(0, 5)

    // Phase 3: Full diversification
    const phase3 = [...phase2, "world", "science", "health"].slice(0, 7)

    return {
      phase1,
      phase2,
      phase3,
      diversificationStrategy: "Gradual expansion from core interests to broader topics",
    }
  }

  /**
   * A/B testing for cold start strategies
   */
  selectColdStartStrategy(userId: string): "demographic" | "llm" | "trending" | "hybrid" {
    // Simple hash-based A/B testing
    const hash = this.simpleHash(userId)
    const strategies = ["demographic", "llm", "trending", "hybrid"]
    return strategies[hash % strategies.length] as any
  }

  private inferCategoriesFromDemographics(age: number, profession: string, gender: string, location: string): string[] {
    const categories: string[] = []

    // Age-based preferences
    if (age < 25) {
      categories.push("technology", "entertainment", "sports")
    } else if (age < 40) {
      categories.push("business", "technology", "health")
    } else if (age < 60) {
      categories.push("politics", "business", "health")
    } else {
      categories.push("politics", "health", "world")
    }

    // Profession-based preferences
    const professionCategories = this.getProfessionCategories(profession)
    categories.push(...professionCategories)

    // Location-based preferences
    if (location.toLowerCase().includes("us")) {
      categories.push("politics", "sports")
    }

    // Remove duplicates and return top 5
    return [...new Set(categories)].slice(0, 5)
  }

  private inferReadingLevel(age: number, profession: string): "basic" | "intermediate" | "advanced" {
    const educationProfessions = ["doctor", "lawyer", "professor", "engineer", "researcher"]

    if (educationProfessions.some((p) => profession.toLowerCase().includes(p))) {
      return "advanced"
    }

    if (age > 30) {
      return "intermediate"
    }

    return "basic"
  }

  private inferContentLength(age: number, profession: string): "short" | "medium" | "long" | "mixed" {
    if (age < 25) return "short"
    if (profession.toLowerCase().includes("executive") || profession.toLowerCase().includes("manager")) {
      return "medium"
    }
    return "mixed"
  }

  private calculateDemographicConfidence(age: number, profession: string, gender: string, location: string): number {
    let confidence = 0.3 // Base confidence

    if (age > 0) confidence += 0.2
    if (profession && profession !== "other") confidence += 0.2
    if (gender && gender !== "prefer_not_to_say") confidence += 0.1
    if (location) confidence += 0.2

    return Math.min(confidence, 0.8) // Max 0.8 for demographic-only
  }

  private getProfessionCategories(profession: string): string[] {
    const professionMap: Record<string, string[]> = {
      engineer: ["technology", "science"],
      doctor: ["health", "science"],
      teacher: ["education", "politics"],
      business: ["business", "politics"],
      lawyer: ["politics", "business"],
      student: ["technology", "entertainment"],
      finance: ["business", "politics"],
      marketing: ["business", "technology"],
    }

    const lowerProfession = profession.toLowerCase()
    for (const [key, categories] of Object.entries(professionMap)) {
      if (lowerProfession.includes(key)) {
        return categories
      }
    }

    return ["business", "world"]
  }

  private getRelatedCategories(categories: string[]): string[] {
    const relationMap: Record<string, string[]> = {
      technology: ["science", "business"],
      business: ["politics", "world"],
      politics: ["world", "business"],
      sports: ["entertainment", "health"],
      health: ["science", "world"],
      entertainment: ["sports", "technology"],
      science: ["technology", "health"],
      world: ["politics", "business"],
    }

    const related: string[] = []
    for (const category of categories) {
      if (relationMap[category]) {
        related.push(...relationMap[category])
      }
    }

    return [...new Set(related)]
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}

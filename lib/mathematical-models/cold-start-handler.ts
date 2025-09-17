import type { UserCredentials, UserPreferences, NewsArticle, RecommendationResult } from "@/types/user-profile"
import { personalizationEngine } from "./personalization-engine"

/**
 * Mathematical Model 4: Cold Start Problem Handler
 * Uses demographic inference, content popularity, and LLM-based preference generation
 */

export class ColdStartHandler {
  private demographicProfiles: Map<string, UserPreferences> = new Map()
  private globalTrends: Record<string, number> = {}

  /**
   * Generate initial preferences for new users using demographic inference
   * Formula: P(category|demographics) = P(demographics|category) * P(category) / P(demographics)
   */
  async generateInitialPreferences(userCredentials: UserCredentials): Promise<UserPreferences> {
    console.log("Generating initial preferences for new user:", userCredentials.id)

    // Create demographic key for clustering
    const demographicKey = this.createDemographicKey(userCredentials)

    // Check if we have a similar demographic profile
    const similarProfile = this.findSimilarDemographicProfile(userCredentials)

    if (similarProfile) {
      console.log("Found similar demographic profile, adapting preferences")
      return this.adaptSimilarProfile(similarProfile, userCredentials)
    }

    // Generate preferences using statistical models
    const basePreferences = this.generateStatisticalPreferences(userCredentials)

    // Enhance with LLM-based inference if available
    try {
      const llmEnhancedPreferences = await this.enhanceWithLLM(basePreferences, userCredentials)
      return llmEnhancedPreferences
    } catch (error) {
      console.warn("LLM enhancement failed, using statistical preferences:", error)
      return basePreferences
    }
  }

  /**
   * Generate cold start recommendations using popularity and demographic matching
   * Formula: ColdStartScore = α*PopularityScore + β*DemographicScore + γ*TrendingScore
   */
  async generateColdStartRecommendations(
    userCredentials: UserCredentials,
    availableArticles: NewsArticle[],
    limit = 20,
  ): Promise<RecommendationResult[]> {
    console.log("Generating cold start recommendations for user:", userCredentials.id)

    const recommendations: RecommendationResult[] = []

    // Get initial preferences
    const initialPreferences = await this.generateInitialPreferences(userCredentials)

    // Weights for cold start scoring
    const weights = {
      popularity: 0.4,
      demographic: 0.35,
      trending: 0.15,
      diversity: 0.1,
    }

    for (const article of availableArticles) {
      // Calculate popularity score
      const popularityScore = this.calculatePopularityScore(article)

      // Calculate demographic matching score
      const demographicScore = this.calculateDemographicMatchingScore(article, userCredentials)

      // Calculate trending score
      const trendingScore = this.calculateTrendingScore(article)

      // Calculate diversity bonus
      const diversityScore = this.calculateDiversityBonus(article, recommendations)

      // Calculate final cold start score
      const coldStartScore =
        weights.popularity * popularityScore +
        weights.demographic * demographicScore +
        weights.trending * trendingScore +
        weights.diversity * diversityScore

      // Location relevance adjustment
      const locationRelevance = this.calculateLocationRelevance(article, userCredentials.location)
      const finalScore = coldStartScore * (1 + locationRelevance * 0.2)

      recommendations.push({
        article,
        score: finalScore,
        reasoning: {
          category_match: demographicScore,
          time_relevance: 1.0, // Neutral for cold start
          location_relevance: locationRelevance,
          behavioral_match: 0.0, // No behavioral data yet
          novelty_score: diversityScore,
          overall_confidence: 0.3, // Low confidence for cold start
        },
        explanation: this.generateColdStartExplanation(article, demographicScore, popularityScore, trendingScore),
      })
    }

    // Sort and apply diversity filtering
    const sortedRecommendations = recommendations.sort((a, b) => b.score - a.score).slice(0, limit * 2)

    // Apply diversity filtering to ensure variety
    const diverseRecommendations = this.applyDiversityFiltering(sortedRecommendations, limit)

    return diverseRecommendations
  }

  /**
   * Adaptive learning for cold start users
   * Updates preferences as soon as user interactions are available
   */
  async adaptPreferencesFromEarlyInteractions(
    userCredentials: UserCredentials,
    initialPreferences: UserPreferences,
    earlyInteractions: Array<{ articleId: string; action: string; category: string; engagement: number }>,
  ): Promise<UserPreferences> {
    console.log("Adapting preferences from early interactions:", earlyInteractions.length)

    const adaptedPreferences = { ...initialPreferences }

    // Quick learning rate for cold start users
    const learningRate = 0.3

    // Update category weights based on early interactions
    const categoryEngagement: Record<string, { total: number; count: number }> = {}

    for (const interaction of earlyInteractions) {
      if (!categoryEngagement[interaction.category]) {
        categoryEngagement[interaction.category] = { total: 0, count: 0 }
      }

      const engagementWeight = this.getEngagementWeight(interaction.action, interaction.engagement)
      categoryEngagement[interaction.category].total += engagementWeight
      categoryEngagement[interaction.category].count += 1
    }

    // Apply exponential moving average to update preferences
    for (const [category, data] of Object.entries(categoryEngagement)) {
      const avgEngagement = data.total / data.count
      const currentWeight = adaptedPreferences.category_weights[category] || 0.3

      adaptedPreferences.category_weights[category] = learningRate * avgEngagement + (1 - learningRate) * currentWeight
    }

    // Increase confidence score based on interaction quality
    const interactionQuality = this.assessInteractionQuality(earlyInteractions)
    adaptedPreferences.confidence_score = Math.min(
      adaptedPreferences.confidence_score + interactionQuality * 0.2,
      0.8, // Cap at 0.8 for cold start users
    )

    adaptedPreferences.last_updated = new Date().toISOString()

    return adaptedPreferences
  }

  /**
   * Segment-based recommendations using user clustering
   * Groups users by demographics and behavior patterns
   */
  async getSegmentBasedRecommendations(
    userCredentials: UserCredentials,
    availableArticles: NewsArticle[],
    limit = 15,
  ): Promise<RecommendationResult[]> {
    // Find user segment
    const userSegment = this.identifyUserSegment(userCredentials)

    if (!userSegment) {
      return this.generateColdStartRecommendations(userCredentials, availableArticles, limit)
    }

    console.log("Using segment-based recommendations for segment:", userSegment.name)

    // Use segment's typical preferences
    const segmentPreferences = userSegment.typical_preferences

    // Generate recommendations using segment preferences
    return personalizationEngine.generateRecommendations(
      {
        user_id: userCredentials.id,
        limit,
        exclude_seen: false,
        time_context: "current",
      },
      userCredentials,
      segmentPreferences,
      [], // No behavioral data for cold start
      availableArticles,
    )
  }

  private createDemographicKey(credentials: UserCredentials): string {
    const ageGroup = this.getAgeGroup(credentials.age)
    const locationKey = `${credentials.location.country}_${credentials.location.state}`
    return `${ageGroup}_${credentials.profession}_${credentials.gender}_${locationKey}`
  }

  private findSimilarDemographicProfile(credentials: UserCredentials): UserPreferences | null {
    const targetKey = this.createDemographicKey(credentials)

    // Look for exact match first
    if (this.demographicProfiles.has(targetKey)) {
      return this.demographicProfiles.get(targetKey)!
    }

    // Look for partial matches
    const ageGroup = this.getAgeGroup(credentials.age)
    const profession = credentials.profession

    for (const [key, profile] of this.demographicProfiles.entries()) {
      const keyParts = key.split("_")
      if (keyParts[0] === ageGroup && keyParts[1] === profession) {
        return profile
      }
    }

    return null
  }

  private adaptSimilarProfile(similarProfile: UserPreferences, credentials: UserCredentials): UserPreferences {
    const adapted = { ...similarProfile }

    // Adjust based on specific user characteristics
    if (credentials.interests.length > 0) {
      // Boost categories related to user interests
      for (const interest of credentials.interests) {
        const relatedCategory = this.mapInterestToCategory(interest)
        if (relatedCategory && adapted.category_weights[relatedCategory]) {
          adapted.category_weights[relatedCategory] *= 1.2
        }
      }
    }

    // Adjust location relevance based on user's location
    adapted.location_relevance = this.calculateLocationRelevancePreference(credentials.location)

    // Reset confidence and timestamp
    adapted.confidence_score = 0.4 // Medium confidence for adapted profile
    adapted.last_updated = new Date().toISOString()

    return adapted
  }

  private generateStatisticalPreferences(credentials: UserCredentials): UserPreferences {
    // Base preferences using statistical models
    const categoryWeights: Record<string, number> = {}

    // Age-based preferences
    const agePreferences = this.getAgeBasedPreferences(credentials.age)

    // Profession-based preferences
    const professionPreferences = this.getProfessionBasedPreferences(credentials.profession)

    // Location-based preferences
    const locationPreferences = this.getLocationBasedPreferences(credentials.location.country)

    // Interest-based preferences
    const interestPreferences = this.getInterestBasedPreferences(credentials.interests)

    // Combine preferences with weights
    const weights = { age: 0.3, profession: 0.3, location: 0.2, interest: 0.2 }

    const allCategories = new Set([
      ...Object.keys(agePreferences),
      ...Object.keys(professionPreferences),
      ...Object.keys(locationPreferences),
      ...Object.keys(interestPreferences),
    ])

    for (const category of allCategories) {
      categoryWeights[category] =
        weights.age * (agePreferences[category] || 0.3) +
        weights.profession * (professionPreferences[category] || 0.3) +
        weights.location * (locationPreferences[category] || 0.3) +
        weights.interest * (interestPreferences[category] || 0.3)
    }

    // Generate time-based preferences (simplified)
    const timeBasedPreferences = this.generateTimeBasedPreferences(credentials)

    return {
      user_id: credentials.id,
      category_weights: categoryWeights,
      time_based_preferences: timeBasedPreferences,
      source_preferences: {},
      content_length_preference: this.inferContentLengthPreference(credentials),
      update_frequency: "hourly",
      language_preferences: credentials.languages,
      location_relevance: this.calculateLocationRelevancePreference(credentials.location),
      recency_preference: this.inferRecencyPreference(credentials),
      diversity_factor: 0.6, // Default diversity
      last_updated: new Date().toISOString(),
      confidence_score: 0.3, // Low confidence for statistical inference
    }
  }

  private async enhanceWithLLM(
    basePreferences: UserPreferences,
    credentials: UserCredentials,
  ): Promise<UserPreferences> {
    // This would integrate with an LLM to enhance preferences
    // For now, return base preferences with slight adjustments

    const enhanced = { ...basePreferences }

    // Simulate LLM enhancement by adjusting preferences based on user profile
    if (credentials.age < 30) {
      enhanced.category_weights.technology = Math.min((enhanced.category_weights.technology || 0.3) * 1.3, 1.0)
      enhanced.category_weights.entertainment = Math.min((enhanced.category_weights.entertainment || 0.3) * 1.2, 1.0)
    }

    if (
      credentials.profession.toLowerCase().includes("engineer") ||
      credentials.profession.toLowerCase().includes("developer")
    ) {
      enhanced.category_weights.technology = Math.min((enhanced.category_weights.technology || 0.3) * 1.4, 1.0)
      enhanced.category_weights.science = Math.min((enhanced.category_weights.science || 0.3) * 1.2, 1.0)
    }

    enhanced.confidence_score = Math.min(basePreferences.confidence_score + 0.1, 0.5)

    return enhanced
  }

  private calculatePopularityScore(article: NewsArticle): number {
    const metrics = article.engagement_metrics
    const totalEngagement = metrics.views + metrics.shares * 5 + metrics.likes * 2 + metrics.comments * 3

    // Normalize using log scale
    return Math.min(Math.log(totalEngagement + 1) / Math.log(10000), 1)
  }

  private calculateDemographicMatchingScore(article: NewsArticle, credentials: UserCredentials): number {
    let score = 0

    // Age-based matching
    const agePreferences = this.getAgeBasedPreferences(credentials.age)
    score += (agePreferences[article.category] || 0.3) * 0.4

    // Profession-based matching
    const professionPreferences = this.getProfessionBasedPreferences(credentials.profession)
    score += (professionPreferences[article.category] || 0.3) * 0.4

    // Interest matching
    const interestScore = this.calculateInterestMatchingScore(article, credentials.interests)
    score += interestScore * 0.2

    return Math.min(score, 1)
  }

  private calculateTrendingScore(article: NewsArticle): number {
    // Combine trending score with recency
    const recencyHours = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60)
    const recencyScore = Math.max(0, 1 - recencyHours / 24) // Decay over 24 hours

    return article.trending_score * 0.7 + recencyScore * 0.3
  }

  private calculateDiversityBonus(article: NewsArticle, existingRecommendations: RecommendationResult[]): number {
    if (existingRecommendations.length === 0) return 0.5

    const existingCategories = existingRecommendations.map((r) => r.article.category)
    const categoryCount = existingCategories.filter((cat) => cat === article.category).length

    // Bonus for categories not yet represented
    return Math.max(0, 1 - categoryCount / 3) // Diminishing returns after 3 articles per category
  }

  private calculateLocationRelevance(article: NewsArticle, location: UserCredentials["location"]): number {
    let relevance = article.location_relevance.global_relevance

    if (article.location_relevance.country === location.country) {
      relevance += 0.3

      if (article.location_relevance.state === location.state) {
        relevance += 0.2

        if (article.location_relevance.city === location.city) {
          relevance += 0.3
        }
      }
    }

    return Math.min(relevance, 1)
  }

  private generateColdStartExplanation(
    article: NewsArticle,
    demographicScore: number,
    popularityScore: number,
    trendingScore: number,
  ): string {
    const reasons = []

    if (popularityScore > 0.7) reasons.push("popular with readers")
    if (demographicScore > 0.6) reasons.push("matches your profile")
    if (trendingScore > 0.8) reasons.push("trending now")
    if (article.credibility_score > 0.8) reasons.push("from a trusted source")

    return reasons.length > 0 ? `Recommended because it's ${reasons.join(", ")}` : "Recommended as a popular article"
  }

  private applyDiversityFiltering(recommendations: RecommendationResult[], limit: number): RecommendationResult[] {
    const selected: RecommendationResult[] = []
    const categoryCount: Record<string, number> = {}
    const maxPerCategory = Math.ceil(limit / 6) // Assuming 6 main categories

    // First pass: select top articles while maintaining diversity
    for (const rec of recommendations) {
      if (selected.length >= limit) break

      const category = rec.article.category
      const currentCount = categoryCount[category] || 0

      if (currentCount < maxPerCategory) {
        selected.push(rec)
        categoryCount[category] = currentCount + 1
      }
    }

    // Second pass: fill remaining slots with highest scoring articles
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

  private getEngagementWeight(action: string, engagement: number): number {
    const actionWeights = {
      view: 0.1,
      click: 0.3,
      read: 1.0,
      share: 1.5,
      save: 1.2,
      like: 0.8,
      skip: -0.2,
    }

    const baseWeight = actionWeights[action as keyof typeof actionWeights] || 0
    return Math.max(baseWeight * (1 + engagement), 0)
  }

  private assessInteractionQuality(interactions: Array<{ action: string; engagement: number }>): number {
    if (interactions.length === 0) return 0

    const qualityScore = interactions.reduce((sum, interaction) => {
      const actionQuality =
        interaction.action === "read"
          ? 1.0
          : interaction.action === "share"
            ? 0.9
            : interaction.action === "save"
              ? 0.8
              : interaction.action === "like"
                ? 0.6
                : 0.3

      return sum + actionQuality * interaction.engagement
    }, 0)

    return Math.min(qualityScore / interactions.length, 1)
  }

  private identifyUserSegment(credentials: UserCredentials) {
    // Simplified user segmentation
    const segments = [
      {
        id: "young_professionals",
        name: "Young Professionals",
        description: "Tech-savvy professionals aged 25-35",
        criteria: {
          age_range: [25, 35] as [number, number],
          professions: ["software_engineer", "business_analyst", "consultant", "designer"],
        },
        typical_preferences: this.getSegmentPreferences("young_professionals"),
        size: 1000,
      },
      {
        id: "senior_executives",
        name: "Senior Executives",
        description: "Business leaders and executives aged 40+",
        criteria: {
          age_range: [40, 65] as [number, number],
          professions: ["ceo", "director", "manager", "executive"],
        },
        typical_preferences: this.getSegmentPreferences("senior_executives"),
        size: 500,
      },
      {
        id: "students",
        name: "Students",
        description: "University and graduate students",
        criteria: {
          age_range: [18, 28] as [number, number],
          professions: ["student"],
        },
        typical_preferences: this.getSegmentPreferences("students"),
        size: 800,
      },
    ]

    for (const segment of segments) {
      const [minAge, maxAge] = segment.criteria.age_range
      const matchesAge = credentials.age >= minAge && credentials.age <= maxAge
      const matchesProfession = segment.criteria.professions?.includes(
        credentials.profession.toLowerCase().replace(" ", "_"),
      )

      if (matchesAge && matchesProfession) {
        return segment
      }
    }

    return null
  }

  private getSegmentPreferences(segmentId: string): UserPreferences {
    const basePreferences = {
      user_id: "segment_" + segmentId,
      category_weights: {} as Record<string, number>,
      time_based_preferences: {} as Record<string, Record<string, number>>,
      source_preferences: {},
      content_length_preference: "medium" as const,
      update_frequency: "hourly" as const,
      language_preferences: ["en"],
      location_relevance: 0.5,
      recency_preference: 0.7,
      diversity_factor: 0.6,
      last_updated: new Date().toISOString(),
      confidence_score: 0.7,
    }

    switch (segmentId) {
      case "young_professionals":
        basePreferences.category_weights = {
          technology: 0.8,
          business: 0.7,
          politics: 0.5,
          entertainment: 0.6,
          sports: 0.4,
          health: 0.5,
          science: 0.6,
          environment: 0.5,
        }
        break

      case "senior_executives":
        basePreferences.category_weights = {
          business: 0.9,
          politics: 0.8,
          technology: 0.6,
          environment: 0.6,
          health: 0.5,
          science: 0.4,
          entertainment: 0.3,
          sports: 0.4,
        }
        break

      case "students":
        basePreferences.category_weights = {
          technology: 0.7,
          entertainment: 0.8,
          sports: 0.6,
          science: 0.7,
          politics: 0.4,
          business: 0.4,
          health: 0.5,
          environment: 0.6,
        }
        break

      default:
        basePreferences.category_weights = {
          politics: 0.5,
          business: 0.5,
          technology: 0.5,
          entertainment: 0.5,
          sports: 0.4,
          health: 0.4,
          science: 0.4,
          environment: 0.4,
        }
    }

    return basePreferences
  }

  private getAgeGroup(age: number): string {
    if (age < 25) return "young"
    if (age < 35) return "young_adult"
    if (age < 50) return "middle_aged"
    return "senior"
  }

  private getAgeBasedPreferences(age: number): Record<string, number> {
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
    const locationMap: Record<string, Record<string, number>> = {
      US: { politics: 0.7, business: 0.8, technology: 0.8, sports: 0.7 },
      UK: { politics: 0.8, business: 0.7, entertainment: 0.6, sports: 0.6 },
      India: { politics: 0.6, technology: 0.7, business: 0.6, entertainment: 0.8 },
      Germany: { business: 0.8, politics: 0.7, environment: 0.7, technology: 0.6 },
    }

    return locationMap[country] || { politics: 0.5, business: 0.5, technology: 0.5 }
  }

  private getInterestBasedPreferences(interests: string[]): Record<string, number> {
    const preferences: Record<string, number> = {}

    for (const interest of interests) {
      const category = this.mapInterestToCategory(interest)
      if (category) {
        preferences[category] = (preferences[category] || 0) + 0.2
      }
    }

    return preferences
  }

  private mapInterestToCategory(interest: string): string | null {
    const interestMap: Record<string, string> = {
      programming: "technology",
      coding: "technology",
      ai: "technology",
      "machine learning": "technology",
      startup: "business",
      investing: "business",
      finance: "business",
      politics: "politics",
      government: "politics",
      sports: "sports",
      football: "sports",
      basketball: "sports",
      movies: "entertainment",
      music: "entertainment",
      gaming: "entertainment",
      health: "health",
      fitness: "health",
      science: "science",
      research: "science",
      environment: "environment",
      climate: "environment",
    }

    const lowerInterest = interest.toLowerCase()
    return interestMap[lowerInterest] || null
  }

  private generateTimeBasedPreferences(credentials: UserCredentials): Record<string, Record<string, number>> {
    const timePreferences: Record<string, Record<string, number>> = {}

    // Generate basic time preferences based on profession and age
    const isWorkingProfessional = !credentials.profession.toLowerCase().includes("student")

    for (let hour = 0; hour < 24; hour++) {
      timePreferences[hour.toString()] = {}

      if (hour >= 6 && hour <= 9) {
        // Morning: news and business
        timePreferences[hour.toString()] = {
          politics: 0.7,
          business: 0.8,
          technology: 0.6,
          health: 0.5,
        }
      } else if (hour >= 12 && hour <= 14) {
        // Lunch: lighter content
        timePreferences[hour.toString()] = {
          entertainment: 0.7,
          sports: 0.6,
          technology: 0.5,
          business: 0.4,
        }
      } else if (hour >= 18 && hour <= 22) {
        // Evening: entertainment and sports
        timePreferences[hour.toString()] = {
          entertainment: 0.8,
          sports: 0.7,
          politics: 0.5,
          business: 0.4,
        }
      } else {
        // Default preferences
        timePreferences[hour.toString()] = {
          politics: 0.5,
          business: 0.5,
          technology: 0.5,
          entertainment: 0.4,
        }
      }
    }

    return timePreferences
  }

  private inferContentLengthPreference(credentials: UserCredentials): "short" | "medium" | "long" | "mixed" {
    // Infer based on profession and age
    if (
      credentials.profession.toLowerCase().includes("executive") ||
      credentials.profession.toLowerCase().includes("manager")
    ) {
      return "short" // Busy professionals prefer shorter content
    }

    if (
      credentials.profession.toLowerCase().includes("researcher") ||
      credentials.profession.toLowerCase().includes("academic")
    ) {
      return "long" // Researchers prefer detailed content
    }

    if (credentials.age < 30) {
      return "short" // Younger users prefer shorter content
    }

    return "medium" // Default to medium length
  }

  private calculateLocationRelevancePreference(location: UserCredentials["location"]): number {
    // Users in smaller cities might prefer more local news
    // This is a simplified heuristic
    return 0.6 // Default moderate location relevance
  }

  private inferRecencyPreference(credentials: UserCredentials): number {
    // Younger users and certain professions prefer more recent news
    if (credentials.age < 30) return 0.8
    if (credentials.profession.toLowerCase().includes("journalist")) return 0.9
    if (credentials.profession.toLowerCase().includes("trader")) return 0.9

    return 0.6 // Default moderate recency preference
  }

  private calculateInterestMatchingScore(article: NewsArticle, interests: string[]): number {
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
}

export const coldStartHandler = new ColdStartHandler()

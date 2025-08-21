interface UserInteraction {
  userId: string
  articleId: string
  interactionType: "view" | "click" | "save" | "share" | "like" | "comment"
  timestamp: Date
  timeSpent: number
  scrollDepth: number
  category?: string
  keywords?: string[]
}

interface UserProfile {
  userId: string
  preferences: {
    categories: Record<string, number>
    keywords: Record<string, number>
    sources: Record<string, number>
    timeOfDay: Record<string, number>
  }
  interactions: UserInteraction[]
  lastUpdated: Date
}

interface RecommendationScore {
  articleId: string
  score: number
  reasons: string[]
}

class MLPersonalizationEngine {
  private userProfiles: Map<string, UserProfile> = new Map()

  // Track user interaction
  trackInteraction(interaction: UserInteraction) {
    const profile = this.getUserProfile(interaction.userId)
    profile.interactions.push(interaction)

    // Update preferences based on interaction
    this.updatePreferences(profile, interaction)
    profile.lastUpdated = new Date()

    this.userProfiles.set(interaction.userId, profile)
  }

  // Get or create user profile
  private getUserProfile(userId: string): UserProfile {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, {
        userId,
        preferences: {
          categories: {},
          keywords: {},
          sources: {},
          timeOfDay: {},
        },
        interactions: [],
        lastUpdated: new Date(),
      })
    }
    return this.userProfiles.get(userId)!
  }

  // Update user preferences based on interaction
  private updatePreferences(profile: UserProfile, interaction: UserInteraction) {
    const weight = this.getInteractionWeight(interaction.interactionType)
    const timeWeight = Math.min(interaction.timeSpent / 60, 5) // Max 5 minutes
    const scrollWeight = interaction.scrollDepth

    const totalWeight = weight * (1 + timeWeight * 0.1 + scrollWeight * 0.1)

    // Update category preferences
    if (interaction.category) {
      profile.preferences.categories[interaction.category] =
        (profile.preferences.categories[interaction.category] || 0) + totalWeight
    }

    // Update keyword preferences
    if (interaction.keywords) {
      interaction.keywords.forEach((keyword) => {
        profile.preferences.keywords[keyword] = (profile.preferences.keywords[keyword] || 0) + totalWeight * 0.5
      })
    }

    // Update time of day preferences
    const hour = interaction.timestamp.getHours()
    const timeSlot = this.getTimeSlot(hour)
    profile.preferences.timeOfDay[timeSlot] = (profile.preferences.timeOfDay[timeSlot] || 0) + totalWeight * 0.2
  }

  // Get interaction weight based on type
  private getInteractionWeight(type: string): number {
    const weights = {
      view: 1,
      click: 2,
      save: 4,
      share: 5,
      like: 3,
      comment: 6,
    }
    return weights[type as keyof typeof weights] || 1
  }

  // Get time slot for hour
  private getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return "morning"
    if (hour >= 12 && hour < 18) return "afternoon"
    if (hour >= 18 && hour < 22) return "evening"
    return "night"
  }

  // Generate recommendations for user
  generateRecommendations(userId: string, articles: any[], maxResults = 10): RecommendationScore[] {
    const profile = this.getUserProfile(userId)

    if (profile.interactions.length === 0) {
      // Cold start - return trending articles
      return articles.slice(0, maxResults).map((article, index) => ({
        articleId: article.id,
        score: 1 - index * 0.1,
        reasons: ["Trending article"],
      }))
    }

    const scores = articles.map((article) => this.scoreArticle(profile, article))

    // Sort by score and return top results
    return scores.sort((a, b) => b.score - a.score).slice(0, maxResults)
  }

  // Score individual article for user
  private scoreArticle(profile: UserProfile, article: any): RecommendationScore {
    let score = 0
    const reasons: string[] = []

    // Category scoring (40% weight)
    const category = this.extractCategory(article)
    if (category && profile.preferences.categories[category]) {
      const categoryScore = profile.preferences.categories[category] * 0.4
      score += categoryScore
      reasons.push(`Matches your interest in ${category}`)
    }

    // Keyword scoring (30% weight)
    const keywords = this.extractKeywords(article)
    let keywordScore = 0
    keywords.forEach((keyword) => {
      if (profile.preferences.keywords[keyword]) {
        keywordScore += profile.preferences.keywords[keyword] * 0.3
        reasons.push(`Contains keyword: ${keyword}`)
      }
    })
    score += keywordScore

    // Recency scoring (15% weight)
    const hoursAgo = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60)
    if (hoursAgo < 6) {
      score += 0.15
      reasons.push("Recent article")
    } else if (hoursAgo < 24) {
      score += 0.1
      reasons.push("Published today")
    }

    // Source scoring (10% weight)
    const source = article.source?.name
    if (source && profile.preferences.sources[source]) {
      score += profile.preferences.sources[source] * 0.1
      reasons.push(`From preferred source: ${source}`)
    }

    // Diversity penalty to avoid echo chambers
    const diversityPenalty = this.calculateDiversityPenalty(profile, article)
    score *= 1 - diversityPenalty

    if (diversityPenalty > 0) {
      reasons.push("Diversity adjustment applied")
    }

    return {
      articleId: article.id,
      score: Math.max(0, score),
      reasons,
    }
  }

  // Extract category from article
  private extractCategory(article: any): string {
    // Try to determine from source name or content
    const source = article.source?.name?.toLowerCase() || ""
    const title = article.title?.toLowerCase() || ""
    const description = article.description?.toLowerCase() || ""

    const text = `${source} ${title} ${description}`

    if (text.includes("tech") || text.includes("technology") || text.includes("ai") || text.includes("software")) {
      return "technology"
    }
    if (text.includes("business") || text.includes("market") || text.includes("finance") || text.includes("economy")) {
      return "business"
    }
    if (text.includes("health") || text.includes("medical") || text.includes("medicine")) {
      return "health"
    }
    if (text.includes("sport") || text.includes("game") || text.includes("team")) {
      return "sports"
    }
    if (text.includes("science") || text.includes("research") || text.includes("study")) {
      return "science"
    }
    if (text.includes("entertainment") || text.includes("movie") || text.includes("music")) {
      return "entertainment"
    }

    return "general"
  }

  // Extract keywords from article
  private extractKeywords(article: any): string[] {
    const text = `${article.title} ${article.description}`.toLowerCase()
    const words = text.split(/\W+/).filter((word) => word.length > 3)

    // Remove common stop words
    const stopWords = new Set([
      "this",
      "that",
      "with",
      "have",
      "will",
      "from",
      "they",
      "been",
      "said",
      "each",
      "which",
      "their",
      "time",
      "more",
      "very",
      "what",
      "know",
      "just",
      "first",
      "into",
      "over",
      "think",
      "also",
      "your",
      "work",
      "life",
      "only",
      "can",
      "still",
      "should",
      "after",
      "being",
      "now",
      "made",
      "before",
      "here",
      "through",
      "when",
      "where",
      "how",
      "all",
      "any",
      "may",
      "say",
      "get",
      "has",
      "had",
      "his",
      "her",
      "him",
      "my",
      "me",
      "we",
      "our",
      "out",
      "up",
      "so",
      "if",
      "no",
      "do",
      "would",
      "who",
      "about",
      "could",
      "there",
      "see",
      "were",
      "been",
      "one",
      "two",
      "way",
      "she",
      "use",
      "its",
      "new",
      "years",
      "year",
      "people",
      "many",
      "well",
      "such",
      "make",
      "them",
      "these",
      "some",
      "other",
      "than",
      "then",
      "now",
      "look",
      "only",
      "come",
      "over",
      "think",
      "also",
      "back",
      "after",
      "use",
      "her",
      "can",
      "out",
      "would",
      "any",
      "there",
      "see",
      "know",
      "get",
      "give",
      "man",
      "day",
      "most",
      "us",
      "is",
      "was",
      "are",
      "been",
      "have",
      "had",
      "has",
      "say",
      "says",
      "said",
      "or",
      "of",
      "to",
      "and",
      "a",
      "in",
      "is",
      "it",
      "you",
      "that",
      "he",
      "was",
      "for",
      "on",
      "are",
      "as",
      "with",
      "his",
      "they",
      "i",
      "at",
      "be",
      "this",
      "have",
      "from",
      "or",
      "one",
      "had",
      "by",
      "word",
      "but",
      "not",
      "what",
      "all",
      "were",
      "we",
      "when",
      "your",
      "can",
      "said",
      "there",
      "each",
      "which",
      "she",
      "do",
      "how",
      "their",
      "if",
      "will",
      "up",
      "other",
      "about",
      "out",
      "many",
      "then",
      "them",
      "these",
      "so",
      "some",
      "her",
      "would",
      "make",
      "like",
      "into",
      "him",
      "time",
      "has",
      "two",
      "more",
      "very",
      "after",
      "words",
      "long",
      "than",
      "first",
      "been",
      "call",
      "who",
      "oil",
      "its",
      "now",
      "find",
      "could",
      "made",
      "may",
      "part",
    ])

    return words.filter((word) => !stopWords.has(word)).slice(0, 10)
  }

  // Calculate diversity penalty to prevent echo chambers
  private calculateDiversityPenalty(profile: UserProfile, article: any): number {
    const recentInteractions = profile.interactions
      .filter((i) => Date.now() - i.timestamp.getTime() < 24 * 60 * 60 * 1000) // Last 24 hours
      .slice(-10) // Last 10 interactions

    if (recentInteractions.length === 0) return 0

    const category = this.extractCategory(article)
    const recentCategories = recentInteractions.map((i) => i.category).filter(Boolean)

    const categoryCount = recentCategories.filter((c) => c === category).length
    const diversityPenalty = Math.min((categoryCount / recentCategories.length) * 0.3, 0.3)

    return diversityPenalty
  }

  // Get user insights
  getUserInsights(userId: string) {
    const profile = this.getUserProfile(userId)

    const totalInteractions = profile.interactions.length
    const recentInteractions = profile.interactions.filter(
      (i) => Date.now() - i.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000,
    ) // Last 7 days

    const engagementScore = this.calculateEngagementScore(profile)
    const topCategories = Object.entries(profile.preferences.categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)

    const readingPatterns = this.analyzeReadingPatterns(profile)

    return {
      totalInteractions,
      recentInteractions: recentInteractions.length,
      engagementScore,
      topCategories,
      readingPatterns,
      lastActive: profile.lastUpdated,
    }
  }

  // Calculate engagement score
  private calculateEngagementScore(profile: UserProfile): number {
    if (profile.interactions.length === 0) return 0

    const recentInteractions = profile.interactions.filter(
      (i) => Date.now() - i.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000,
    )

    const totalWeight = recentInteractions.reduce((sum, interaction) => {
      return sum + this.getInteractionWeight(interaction.interactionType)
    }, 0)

    const avgTimeSpent = recentInteractions.reduce((sum, i) => sum + i.timeSpent, 0) / recentInteractions.length
    const avgScrollDepth = recentInteractions.reduce((sum, i) => sum + i.scrollDepth, 0) / recentInteractions.length

    return Math.min(100, (totalWeight / recentInteractions.length) * 10 + avgTimeSpent * 0.1 + avgScrollDepth * 20)
  }

  // Analyze reading patterns
  private analyzeReadingPatterns(profile: UserProfile) {
    const interactions = profile.interactions

    if (interactions.length === 0) {
      return {
        averageReadTime: 0,
        peakHours: [],
        consistency: 0,
        preferredTimeSlot: "morning",
      }
    }

    const averageReadTime = interactions.reduce((sum, i) => sum + i.timeSpent, 0) / interactions.length

    // Find peak hours
    const hourCounts: Record<number, number> = {}
    interactions.forEach((i) => {
      const hour = i.timestamp.getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    const peakHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => Number.parseInt(hour))

    // Calculate consistency (how regularly user reads)
    const days = new Set(interactions.map((i) => i.timestamp.toDateString())).size
    const totalDays = Math.max(1, (Date.now() - interactions[0].timestamp.getTime()) / (24 * 60 * 60 * 1000))
    const consistency = Math.min(100, (days / totalDays) * 100)

    // Find preferred time slot
    const timeSlotCounts = Object.entries(profile.preferences.timeOfDay).sort(([, a], [, b]) => b - a)
    const preferredTimeSlot = timeSlotCounts[0]?.[0] || "morning"

    return {
      averageReadTime,
      peakHours,
      consistency,
      preferredTimeSlot,
    }
  }
}

// Export singleton instance
export const mlPersonalizationEngine = new MLPersonalizationEngine()

// Export types
export type { UserInteraction, UserProfile, RecommendationScore }

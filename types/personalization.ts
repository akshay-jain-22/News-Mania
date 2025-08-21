export interface UserInteraction {
  userId: string
  articleId: string
  interactionType: "view" | "click" | "save" | "share" | "like" | "comment"
  timestamp: Date
  timeSpent: number
  scrollDepth: number
  category?: string
  keywords?: string[]
}

export interface UserProfile {
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

export interface RecommendationScore {
  articleId: string
  score: number
  reasons: string[]
}

export interface UserInsights {
  totalInteractions: number
  recentInteractions: number
  engagementScore: number
  topCategories: [string, number][]
  readingPatterns: {
    averageReadTime: number
    peakHours: number[]
    consistency: number
    preferredTimeSlot: string
  }
  lastActive: Date
}

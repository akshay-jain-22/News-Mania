export interface UserProfile {
  userId: string
  preferredCategories: string[]
  readArticles: string[]
  clickHistory: ClickHistory[]
  searchHistory: string[]
  timeSpentOnCategories: Record<string, number>
  lastActiveDate: string
  interests: string[]
  dislikedTopics: string[]
}

export interface ClickHistory {
  articleId: string
  timestamp: string
  action: "click" | "read" | "share" | "save" | "skip" | "like" | "dislike"
  timeSpent?: number
  category: string
}

export interface ArticleEmbedding {
  articleId: string
  embedding: number[]
  category: string
  keywords: string[]
  sentiment: number
  popularity: number
  publishedAt: string
}

export interface UserEmbedding {
  userId: string
  embedding: number[]
  lastUpdated: string
  confidence: number
}

export interface RecommendationResult {
  articleId: string
  score: number
  reason: string
  category: string
  confidence: number
  personalizedHeadline?: string
}

export interface RecommendationRequest {
  userId: string
  maxResults?: number
  categories?: string[]
  excludeReadArticles?: boolean
}

export interface PersonalizedFeed {
  userId: string
  recommendations: (RecommendationResult & { personalizedHeadline?: string })[]
  personalizedMessage: string
  lastUpdated: string
  feedType: "personalized" | "trending" | "category"
  articles?: any[]
}

export interface PersonalizationSettings {
  userId: string
  autoPersonalize: boolean
  preferredLanguage: string
  contentFilters: string[]
  notificationPreferences: {
    breaking: boolean
    daily: boolean
    weekly: boolean
  }
  privacySettings: {
    trackReading: boolean
    shareData: boolean
  }
}

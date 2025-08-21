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
  action: "click" | "read" | "share" | "save" | "fact-check"
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
}

export interface RecommendationRequest {
  userId: string
  maxResults?: number
  excludeReadArticles?: boolean
  categories?: string[]
}

export interface PersonalizedFeed {
  userId: string
  recommendations: (RecommendationResult & { personalizedHeadline?: string })[]
  personalizedMessage: string
  lastUpdated: string
  feedType: "personalized" | "trending"
  articles?: any[]
}

export interface UserProfile {
  id: string
  email: string
  name?: string
  avatar?: string
  preferences: {
    categories: string[]
    sources: string[]
    readingTime?: string
  }
  stats: {
    articlesRead: number
    totalReadingTime: number
    favoriteCategories: string[]
  }
}

export interface UserCredentials {
  id: string
  email: string
  age: number
  location: {
    country: string
    city?: string
  }
  profession: string
}

export interface UserBehavior {
  user_id: string
  session_id: string
  article_id: string
  action: "view" | "read" | "like" | "share" | "save" | "click"
  timestamp: string
  time_of_day: number
  day_of_week: number
  read_duration: number
  scroll_depth: number
  device_type: "mobile" | "tablet" | "desktop"
  source: "homepage" | "search" | "recommendation" | "shared"
  category: string
  sentiment_reaction: "positive" | "negative" | "neutral"
}

export interface UserPreferences {
  user_id: string
  category_weights: Record<string, number>
  source_preferences: Record<string, number>
  confidence_score: number
  last_updated: string
  reading_patterns: {
    peak_hours: number[]
    preferred_device: "mobile" | "desktop"
    average_session_length: number
  }
  engagement_profile: {
    engagement_score: number
    interaction_count: number
    retention_score: number
  }
  behavioral_profile: {
    categoryPreferences: Array<{ category: string; score: number }>
    interactionHistory: Array<{ articleId: string; action: string }>
    engagementScore: number
  }
}

export interface NewsArticle {
  id: string
  title: string
  description: string
  content: string
  url: string
  urlToImage?: string
  publishedAt: string
  source: { name: string; id?: string }
  author?: string
  category?: string
}

export interface RecommendationRequest {
  user_id: string
  limit?: number
  categories?: string[]
  exclude_seen?: boolean
  location_filter?: boolean
  diversity_boost?: number
}

export interface RecommendationResult {
  article: NewsArticle
  score: number
  reasoning: {
    category_match: number
    time_relevance: number
    location_relevance: number
    behavioral_match: number
    novelty_score: number
    overall_confidence: number
  }
  explanation: string
}

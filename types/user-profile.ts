export interface UserCredentials {
  id: string
  email: string
  age: number
  profession: string
  gender: "male" | "female" | "other" | "prefer_not_to_say"
  location: {
    country: string
    state: string
    city: string
    timezone: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  interests: string[]
  languages: string[]
  created_at: string
  updated_at: string
}

export interface UserBehavior {
  user_id: string
  session_id: string
  article_id: string
  action: "view" | "click" | "read" | "share" | "save" | "skip" | "like" | "dislike"
  timestamp: string
  time_of_day: number // 0-23 hours
  day_of_week: number // 0-6 (Sunday = 0)
  read_duration: number // seconds
  scroll_depth: number // 0-1 (percentage)
  device_type: "mobile" | "desktop" | "tablet"
  source: "recommendation" | "search" | "trending" | "category"
  category: string
  sentiment_reaction?: "positive" | "negative" | "neutral"
}

export interface UserPreferences {
  user_id: string
  category_weights: Record<string, number> // politics: 0.8, sports: 0.3, etc.
  time_based_preferences: Record<string, Record<string, number>> // hour -> category -> weight
  source_preferences: Record<string, number> // source reliability preferences
  content_length_preference: "short" | "medium" | "long" | "mixed"
  update_frequency: "real_time" | "hourly" | "daily"
  language_preferences: string[]
  location_relevance: number // 0-1, how much local news matters
  recency_preference: number // 0-1, preference for recent vs evergreen content
  diversity_factor: number // 0-1, how much variety in recommendations
  last_updated: string
  confidence_score: number // 0-1, how confident we are in these preferences
}

export interface UserProfile {
  id: string
  email: string
  age: number
  profession: string
  gender: "male" | "female" | "other" | "prefer_not_to_say"
  location: {
    country: string
    city: string
    timezone: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  preferences: {
    categories: string[]
    languages: string[]
    readingLevel: "basic" | "intermediate" | "advanced"
    contentLength: "short" | "medium" | "long" | "mixed"
  }
  behaviorProfile: {
    readingTimes: TimeBasedPreference[]
    categoryPreferences: CategoryPreference[]
    interactionHistory: UserInteraction[]
    engagementScore: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface TimeBasedPreference {
  timeSlot: string // '00-06', '06-12', '12-18', '18-24'
  categories: string[]
  avgReadTime: number
  engagementScore: number
}

export interface CategoryPreference {
  category: string
  score: number
  confidence: number
  lastUpdated: Date
}

export interface UserInteraction {
  articleId: string
  action: "view" | "click" | "share" | "save" | "skip"
  timestamp: Date
  readTime?: number
  category: string
  timeOfDay: string
  deviceType: string
}

export interface NewsArticle {
  id: string
  title: string
  description: string
  content: string
  url: string
  urlToImage?: string
  publishedAt: string
  source: {
    id?: string
    name: string
    reliability_score: number
  }
  author?: string
  category: string
  subcategory?: string
  location_relevance: {
    country?: string
    state?: string
    city?: string
    global_relevance: number
  }
  sentiment: "positive" | "negative" | "neutral"
  complexity_score: number // 0-1, reading difficulty
  estimated_read_time: number // minutes
  keywords: string[]
  entities: string[] // people, organizations, locations mentioned
  trending_score: number // 0-1
  credibility_score: number // 0-1
  engagement_metrics: {
    views: number
    shares: number
    comments: number
    likes: number
  }
  embedding_vector?: number[] // for similarity calculations
}

export interface RecommendationRequest {
  user_id: string
  limit: number
  exclude_seen?: boolean
  time_context?: "current" | "specific"
  specific_time?: string
  categories?: string[]
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

export interface UserSegment {
  id: string
  name: string
  description: string
  criteria: {
    age_range?: [number, number]
    professions?: string[]
    locations?: string[]
    behavior_patterns?: string[]
  }
  typical_preferences: UserPreferences
  size: number
}

export interface RecommendationScore {
  articleId: string
  score: number
  reasons: string[]
  confidence: number
  pipeline: "collaborative" | "content" | "demographic" | "behavioral" | "cold_start"
}

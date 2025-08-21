export interface UserProfile {
  userId: string
  categoryPreferences: Map<string, number>
  keywordPreferences: Map<string, number>
  readingPatterns: ReadingPatterns
  totalInteractions: number
  lastActiveDate: string
  createdAt: string
}

export interface ReadingPatterns {
  timeOfDay: Map<number, number> // hour -> count
  averageReadTime: number
  preferredLength: "short" | "medium" | "long"
}

export interface UserInteraction {
  userId: string
  articleId: string
  interactionType: "view" | "click" | "read" | "share" | "save" | "like" | "comment"
  timestamp: string
  timeSpent: number // seconds
  scrollDepth: number // 0-1
  sessionId: string
}

export interface PersonalizationModel {
  userId: string
  modelVersion: string
  categoryWeights: Record<string, number>
  keywordEmbeddings: Record<string, number[]>
  lastTrainingDate: string
  accuracy: number
}

export interface RecommendationResult {
  articleId: string
  score: number
  reason: string
  confidence: number
  personalizedHeadline?: string
}

export interface UserInsights {
  totalInteractions: number
  topCategories: [string, number][]
  topKeywords: [string, number][]
  readingPatterns: {
    averageReadTime: number
    peakHours: number[]
    consistency: number
  }
  engagementScore: number
}

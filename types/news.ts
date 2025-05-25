export interface NewsSource {
  id: string | null
  name: string
}

export interface NewsArticle {
  id: string
  source: NewsSource
  author: string | null
  title: string
  description: string
  url: string
  urlToImage: string | null
  publishedAt: string
  content: string
  credibilityScore?: number
  isFactChecked?: boolean
  factCheckResult?: string | null
}

export interface FactCheckResult {
  isFactChecked: boolean
  credibilityScore: number
  factCheckResult: string | null
  claimsAnalyzed?: FactCheckClaim[]
}

export interface FactCheckClaim {
  claim: string
  verdict: "true" | "false" | "partially true" | "unverified"
  explanation: string
  sources?: string[]
}

export interface UserPreferences {
  preferredTopics: string[]
  preferredSources: string[]
  excludedSources: string[]
  language: string
  region: string
  darkMode: boolean
  notificationsEnabled: boolean
}

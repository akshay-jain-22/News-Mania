export interface NewsSource {
  id: string | null
  name: string
}

export interface NewsArticle {
  id: string
  title: string
  description: string
  content?: string
  image?: string
  source: string
  url: string
  publishedAt: Date
  category?: string
}

export interface SearchResult {
  articles: NewsArticle[]
  total: number
}

export interface FactCheckClaim {
  claim: string
  verdict: "true" | "false" | "partially true" | "unverified"
  explanation: string
  sources?: string[]
}

export interface FactCheckResult {
  isFactChecked: boolean
  credibilityScore: number
  factCheckResult: string
  claimsAnalyzed?: FactCheckClaim[]
  analysisFactors?: string[]
  analyzedBy?: string
}

export interface UserPreferences {
  categories: string[]
  sources: string[]
  autoRefresh: boolean
  refreshInterval: number
  theme: "light" | "dark" | "system"
}

export interface TopicData {
  name: string
  description: string
  icon: string
  color: string
  articles?: NewsArticle[]
}

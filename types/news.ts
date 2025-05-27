export interface NewsSource {
  id: string | null
  name: string
}

export interface NewsArticle {
  id: string
  source: NewsSource
  author: string
  title: string
  description: string
  url: string
  urlToImage: string | null
  publishedAt: string
  content: string
  credibilityScore?: number
  isFactChecked?: boolean
  factCheckResult?: string | null
  claimsAnalyzed?: FactCheckClaim[]
  analysisFactors?: string[]
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

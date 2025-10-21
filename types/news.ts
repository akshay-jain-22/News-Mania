export interface NewsArticle {
  id: string
  title: string
  description: string
  content: string
  image: string
  source: string
  url: string
  publishedAt: string
  category: string
}

export interface SearchResult {
  articles: NewsArticle[]
  totalResults: number
}

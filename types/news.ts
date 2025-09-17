export interface NewsArticle {
  id: string
  title: string
  description: string
  content: string
  url: string
  imageUrl?: string
  publishedAt: string
  source: string
  category: string
  author?: string
}

export interface NewsCategory {
  id: string
  name: string
  slug: string
}

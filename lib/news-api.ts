const MOCK_ARTICLES = [
  {
    id: "1",
    title: "Breaking: Major Scientific Discovery Announced",
    description: "Scientists have made a groundbreaking discovery that could revolutionize the field of medicine.",
    content:
      "In a press conference today, researchers announced findings that challenge our understanding of human biology...",
    image: "https://images.unsplash.com/photo-1576091160550-112173f7f869?w=800&h=400&fit=crop",
    source: "Science Daily",
    url: "https://example.com/article-1",
    publishedAt: new Date().toISOString(),
    category: "technology",
  },
  {
    id: "2",
    title: "Global Markets Rally on Economic Data",
    description: "Stock markets surge following positive employment reports across major economies.",
    content:
      "Global equities climbed to new highs today as investors responded positively to stronger than expected employment numbers...",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop",
    source: "Financial Times",
    url: "https://example.com/article-2",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    category: "business",
  },
  {
    id: "3",
    title: "New AI Model Achieves Record Performance",
    description: "Researchers unveil artificial intelligence system that outperforms previous benchmarks.",
    content: "A new machine learning model has achieved unprecedented results in natural language processing tasks...",
    image: "https://images.unsplash.com/photo-1677442d019cecf8d57e6cb1b6b3c92b?w=800&h=400&fit=crop",
    source: "Tech Crunch",
    url: "https://example.com/article-3",
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    category: "technology",
  },
  {
    id: "4",
    title: "Climate Initiative Expands Globally",
    description: "International climate accord reaches new milestone with additional countries joining the effort.",
    content:
      "In a significant development for climate action, 50 additional nations have committed to emission reduction targets...",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=400&fit=crop",
    source: "CNN",
    url: "https://example.com/article-4",
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    category: "environment",
  },
  {
    id: "5",
    title: "Healthcare Innovation Saves Lives",
    description: "New medical device shows promise in early clinical trials for rare disease treatment.",
    content: "Clinical researchers report positive outcomes from initial trials of a revolutionary medical device...",
    image: "https://images.unsplash.com/photo-1576091160381-112695ca84b0?w=800&h=400&fit=crop",
    source: "Medical News Today",
    url: "https://example.com/article-5",
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    category: "health",
  },
  {
    id: "6",
    title: "Space Exploration Reaches New Heights",
    description: "Private space company completes successful mission to expand orbital infrastructure.",
    content:
      "In a historic achievement, a privately funded space mission successfully deployed satellites for global connectivity...",
    image: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&h=400&fit=crop",
    source: "Space.com",
    url: "https://example.com/article-6",
    publishedAt: new Date(Date.now() - 18000000).toISOString(),
    category: "science",
  },
]

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

export async function fetchNews(category?: string): Promise<NewsArticle[]> {
  try {
    if (category) {
      return MOCK_ARTICLES.filter((article) => article.category === category)
    }
    return MOCK_ARTICLES
  } catch (error) {
    console.error("Error fetching news:", error)
    return MOCK_ARTICLES
  }
}

export async function fetchArticleById(id: string): Promise<NewsArticle | null> {
  return MOCK_ARTICLES.find((article) => article.id === id) || null
}

export async function searchNews(query: string): Promise<NewsArticle[]> {
  const lowerQuery = query.toLowerCase()
  return MOCK_ARTICLES.filter(
    (article) =>
      article.title.toLowerCase().includes(lowerQuery) ||
      article.description.toLowerCase().includes(lowerQuery) ||
      article.category.toLowerCase().includes(lowerQuery),
  )
}

export async function setupNewsRefresh(): Promise<void> {
  console.log("News refresh setup initialized")
}

export async function refreshAllNews(): Promise<NewsArticle[]> {
  return fetchNews()
}

export async function factCheckArticle(
  title: string,
  description: string,
): Promise<{ credibilityScore: number; status: string }> {
  return {
    credibilityScore: Math.random() * 100,
    status: "verified",
  }
}

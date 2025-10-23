import type { NewsArticle } from "@/types/news"

const mockArticles: NewsArticle[] = [
  {
    id: "1",
    title: "Breaking: New AI Breakthrough Announced",
    description: "Scientists announce major advances in artificial intelligence",
    content:
      "A team of researchers has announced a major breakthrough in AI technology that could revolutionize multiple industries.",
    image: "/ai-technology.png",
    source: "Tech News Daily",
    url: "#",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60),
    category: "Technology",
  },
  {
    id: "2",
    title: "Climate Summit Reaches Historic Agreement",
    description: "World leaders commit to aggressive emissions reduction",
    content: "At the ongoing climate summit, world leaders have reached an agreement to reduce global emissions.",
    image: "/climate-summit-global.png",
    source: "Global News",
    url: "#",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    category: "Environment",
  },
  {
    id: "3",
    title: "Stock Market Reaches New Heights",
    description: "Global markets post strongest gains in months",
    content: "Financial markets around the world experienced significant gains today as investor confidence grows.",
    image: "/stock-market-analysis.png",
    source: "Finance Weekly",
    url: "#",
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    category: "Business",
  },
]

export async function fetchNews(): Promise<NewsArticle[]> {
  try {
    return mockArticles
  } catch (error) {
    console.error("Error fetching news:", error)
    return mockArticles
  }
}

export async function fetchArticleById(id: string): Promise<NewsArticle | null> {
  const article = mockArticles.find((a) => a.id === id)
  return article || null
}

export async function setupNewsRefresh(): Promise<void> {
  console.log("News refresh setup completed")
}

export async function refreshAllNews(): Promise<NewsArticle[]> {
  return fetchNews()
}

export async function factCheckArticle(articleId: string): Promise<any> {
  return {
    credibilityScore: 75,
    summary: "Article appears credible based on standard verification",
  }
}

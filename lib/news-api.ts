import type { NewsArticle } from "@/types/news"

const MOCK_ARTICLES: NewsArticle[] = [
  {
    id: "1",
    title: "AI Breakthrough: New Model Surpasses Human Performance",
    description:
      "Researchers announce a groundbreaking AI model that demonstrates unprecedented capabilities in reasoning and understanding.",
    content:
      "In a significant milestone for artificial intelligence, researchers have unveiled a new model that surpasses human performance on multiple benchmarks...",
    image: "https://images.unsplash.com/photo-1677442d019cecf8b7faf4f5b9f4f7f7-1676641686?w=800&q=80",
    source: "TechNews Daily",
    url: "https://technewsdaily.com/ai-breakthrough",
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category: "technology",
    author: "Jane Smith",
  },
  {
    id: "2",
    title: "Climate Summit Reaches Historic Agreement",
    description: "World leaders agree on unprecedented measures to combat climate change and reduce carbon emissions.",
    content:
      "At the conclusion of the global climate summit, world leaders have reached a historic agreement on carbon reduction targets...",
    image: "https://images.unsplash.com/photo-1569163139394-de4798aa62b1-1676641686?w=800&q=80",
    source: "Global News Network",
    url: "https://globalnews.com/climate-agreement",
    publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    category: "environment",
    author: "John Davis",
  },
  {
    id: "3",
    title: "Tech Giants Report Record Q4 Earnings",
    description:
      "Major technology companies announce their strongest quarterly results in history driven by cloud and AI services.",
    content: "In their latest earnings reports, leading technology companies reported record-breaking revenues...",
    image: "https://images.unsplash.com/photo-1611532736579-6b16e2b50449-1676641686?w=800&q=80",
    source: "Business Daily",
    url: "https://businessdaily.com/tech-earnings",
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    category: "business",
    author: "Mike Johnson",
  },
  {
    id: "4",
    title: "Breakthrough in Cancer Research Offers New Hope",
    description: "Scientists discover a revolutionary treatment that shows promising results in early clinical trials.",
    content:
      "Medical researchers have announced a breakthrough in cancer treatment that could transform patient outcomes...",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef-1676641686?w=800&q=80",
    source: "Medical Review",
    url: "https://medicalreview.com/cancer-breakthrough",
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    category: "health",
    author: "Dr. Sarah Wilson",
  },
  {
    id: "5",
    title: "Space Mission Discovers Potential Signs of Life",
    description: "The latest Mars rover has detected organic compounds that could indicate microbial life.",
    content: "Astronomers have announced exciting findings from the latest Mars exploration mission...",
    image: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2-1676641686?w=800&q=80",
    source: "Space Today",
    url: "https://spacetoday.com/mars-discovery",
    publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    category: "science",
    author: "Dr. Alex Turner",
  },
  {
    id: "6",
    title: "Championship Final Delivers Unforgettable Performance",
    description:
      "Athletes showcase extraordinary skill and determination in the most-watched sporting event of the year.",
    content:
      "The championship final yesterday saw incredible performances as athletes competed at the highest level...",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211-1676641686?w=800&q=80",
    source: "Sports Central",
    url: "https://sportscentral.com/championship-final",
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    category: "sports",
    author: "Tom Martinez",
  },
]

export async function fetchNews(category?: string): Promise<NewsArticle[]> {
  try {
    // Try to fetch from API if key exists
    if (process.env.NEWS_API_KEY) {
      const categoryParam = category ? `&category=${category}` : ""
      const response = await fetch(
        `https://newsapi.org/v2/top-headlines?country=us${categoryParam}&apiKey=${process.env.NEWS_API_KEY}`,
      )
      if (response.ok) {
        const data = await response.json()
        return data.articles.map((article: any, index: number) => ({
          id: `${index}`,
          title: article.title,
          description: article.description,
          content: article.content,
          image: article.urlToImage || "https://images.unsplash.com/photo-1495563014258-e376b5c61a84?w=800&q=80",
          source: article.source.name,
          url: article.url,
          publishedAt: article.publishedAt,
          category: category || "general",
          author: article.author,
        }))
      }
    }
  } catch (error) {
    console.error("Error fetching news:", error)
  }

  // Return mock data as fallback
  if (category) {
    return MOCK_ARTICLES.filter((article) => article.category === category)
  }
  return MOCK_ARTICLES
}

export async function searchNews(query: string): Promise<NewsArticle[]> {
  if (!query) return MOCK_ARTICLES

  const searchLower = query.toLowerCase()
  return MOCK_ARTICLES.filter(
    (article) =>
      article.title.toLowerCase().includes(searchLower) ||
      article.description.toLowerCase().includes(searchLower) ||
      article.category.toLowerCase().includes(searchLower),
  )
}

export async function fetchArticleById(id: string): Promise<NewsArticle | undefined> {
  return MOCK_ARTICLES.find((article) => article.id === id)
}

export async function setupNewsRefresh(): Promise<void> {
  // Setup automatic refresh
  console.log("News refresh setup initiated")
}

export async function refreshAllNews(): Promise<NewsArticle[]> {
  return fetchNews()
}

export async function factCheckArticle(article: NewsArticle): Promise<{ isAccurate: boolean; confidence: number }> {
  // Simple fact-check simulation
  return {
    isAccurate: Math.random() > 0.3,
    confidence: Math.random() * 0.5 + 0.5,
  }
}

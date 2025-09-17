import type { NewsArticle } from "@/types/news"

const NEWS_API_KEY = process.env.NEWS_API_KEY

export async function fetchNews(category?: string): Promise<NewsArticle[]> {
  try {
    const url = category
      ? `https://newsapi.org/v2/top-headlines?category=${category}&country=us&apiKey=${NEWS_API_KEY}`
      : `https://newsapi.org/v2/top-headlines?country=us&apiKey=${NEWS_API_KEY}`

    const response = await fetch(url)
    const data = await response.json()

    if (!data.articles) {
      return getMockNews()
    }

    return data.articles.map((article: any) => ({
      id: article.url,
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url,
      imageUrl: article.urlToImage,
      publishedAt: article.publishedAt,
      source: article.source.name,
      category: category || "general",
      author: article.author,
    }))
  } catch (error) {
    console.error("Error fetching news:", error)
    return getMockNews()
  }
}

function getMockNews(): NewsArticle[] {
  return [
    {
      id: "1",
      title: "Breaking: Major Technology Breakthrough Announced",
      description: "Scientists have made a significant breakthrough in quantum computing technology.",
      content:
        "In a groundbreaking development, researchers have successfully demonstrated a new quantum computing architecture...",
      url: "#",
      imageUrl: "/placeholder.svg?height=200&width=400&text=Tech+News",
      publishedAt: new Date().toISOString(),
      source: "Tech News",
      category: "technology",
      author: "John Doe",
    },
    {
      id: "2",
      title: "Global Climate Summit Reaches Historic Agreement",
      description: "World leaders unite on ambitious climate action plan.",
      content: "Representatives from over 190 countries have reached a consensus on new climate policies...",
      url: "#",
      imageUrl: "/placeholder.svg?height=200&width=400&text=Climate+News",
      publishedAt: new Date().toISOString(),
      source: "Global News",
      category: "environment",
      author: "Jane Smith",
    },
    {
      id: "3",
      title: "Stock Markets Show Strong Recovery",
      description: "Major indices post significant gains amid positive economic indicators.",
      content: "Financial markets around the world are showing signs of robust recovery...",
      url: "#",
      imageUrl: "/placeholder.svg?height=200&width=400&text=Finance+News",
      publishedAt: new Date().toISOString(),
      source: "Financial Times",
      category: "business",
      author: "Mike Johnson",
    },
  ]
}

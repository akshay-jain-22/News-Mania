import { type NextRequest, NextResponse } from "next/server"
import type { NewsArticle } from "@/types/news"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "10")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log(`🤖 Generating ML recommendations for user: ${userId}`)

    // Generate sample recommendations without external API calls
    const recommendations = generateSampleRecommendations(userId, maxResults)

    return NextResponse.json({
      userId,
      recommendations,
      totalCount: recommendations.length,
      generatedAt: new Date().toISOString(),
      algorithm: "local-ml-v1",
    })
  } catch (error) {
    console.error("Error generating ML recommendations:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}

function generateSampleRecommendations(userId: string, maxResults: number): NewsArticle[] {
  const sampleArticles: NewsArticle[] = [
    {
      id: `ml-rec-1-${userId}`,
      title: "AI Revolution: How Machine Learning is Transforming News Consumption",
      description:
        "Discover how artificial intelligence is personalizing your news experience and making information more relevant than ever.",
      url: "https://example.com/ai-news",
      urlToImage: "/ai-technology-news.png",
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      source: { name: "Tech Today" },
      content: "Artificial intelligence is revolutionizing how we consume news...",
      recommendationScore: 0.95,
      recommendationReasons: ["Matches your tech interests", "High engagement content"],
      credibilityScore: 92,
      personalizedHeadline: "🚀 AI Revolution: How Machine Learning is Transforming Your News Experience",
    },
    {
      id: `ml-rec-2-${userId}`,
      title: "Breaking: Global Climate Summit Reaches Historic Agreement",
      description: "World leaders unite on ambitious climate targets, marking a turning point in environmental policy.",
      url: "https://example.com/climate-news",
      urlToImage: "/climate-summit-leaders.png",
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      source: { name: "Global News" },
      content: "In a historic move, world leaders have reached a comprehensive agreement...",
      recommendationScore: 0.88,
      recommendationReasons: ["Trending globally", "Important news"],
      credibilityScore: 95,
      personalizedHeadline: "🌍 Breaking: Global Climate Summit Reaches Historic Agreement",
    },
    {
      id: `ml-rec-3-${userId}`,
      title: "Tech Giants Report Record Quarterly Earnings",
      description: "Major technology companies exceed expectations with strong performance across all sectors.",
      url: "https://example.com/tech-earnings",
      urlToImage: "/technology-companies-earnings.png",
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      source: { name: "Business Wire" },
      content: "Technology companies have reported exceptional quarterly results...",
      recommendationScore: 0.82,
      recommendationReasons: ["Business interest", "Recent article"],
      credibilityScore: 89,
      personalizedHeadline: "📈 Tech Giants Report Record Quarterly Earnings",
    },
    {
      id: `ml-rec-4-${userId}`,
      title: "Revolutionary Medical Breakthrough in Cancer Treatment",
      description: "Scientists develop new immunotherapy approach showing promising results in clinical trials.",
      url: "https://example.com/medical-breakthrough",
      urlToImage: "/placeholder.svg?height=200&width=300&text=Medical+Research",
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      source: { name: "Medical Journal" },
      content: "A groundbreaking new approach to cancer treatment has shown remarkable results...",
      recommendationScore: 0.79,
      recommendationReasons: ["Health category", "Scientific breakthrough"],
      credibilityScore: 97,
      personalizedHeadline: "🏥 Revolutionary Medical Breakthrough in Cancer Treatment",
    },
    {
      id: `ml-rec-5-${userId}`,
      title: "Space Exploration: New Mars Mission Reveals Surprising Discoveries",
      description:
        "Latest data from Mars rover uncovers evidence that could reshape our understanding of the Red Planet.",
      url: "https://example.com/mars-discovery",
      urlToImage: "/mars-rover-exploration.png",
      publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      source: { name: "Space News" },
      content: "The latest Mars mission has uncovered fascinating evidence...",
      recommendationScore: 0.75,
      recommendationReasons: ["Science interest", "Exploration content"],
      credibilityScore: 91,
      personalizedHeadline: "🔬 Space Exploration: New Mars Mission Reveals Surprising Discoveries",
    },
    {
      id: `ml-rec-6-${userId}`,
      title: "Economic Markets Show Strong Recovery Signals",
      description: "Financial analysts report positive indicators as global markets demonstrate resilience and growth.",
      url: "https://example.com/market-recovery",
      urlToImage: "/financial-markets-economy-growth.png",
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      source: { name: "Financial Times" },
      content: "Global financial markets are showing strong signs of recovery...",
      recommendationScore: 0.72,
      recommendationReasons: ["Economic news", "Market trends"],
      credibilityScore: 88,
      personalizedHeadline: "📈 Economic Markets Show Strong Recovery Signals",
    },
  ]

  // Shuffle and return requested number
  const shuffled = sampleArticles.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, maxResults)
}

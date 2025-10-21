import { type NextRequest, NextResponse } from "next/server"
import { recommendationEngine } from "@/lib/recommendation-engine"
import type { NewsArticle } from "@/types/news"
import type { UserProfile } from "@/types/recommendations"

// In-memory storage for demo (use database in production)
const userProfiles = new Map<string, UserProfile>()
const userAnalytics = new Map<string, Record<string, number>>()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const maxResults = Number.parseInt(searchParams.get("maxResults") || "10")
    const categories = searchParams.get("categories")?.split(",")
    const excludeRead = searchParams.get("excludeRead") === "true"

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const recommendations = await recommendationEngine.getRecommendations({
      userId,
      maxResults,
      categories,
      excludeReadArticles: excludeRead,
    })

    return NextResponse.json({
      recommendations,
      success: true,
    })
  } catch (error) {
    console.error("Error getting recommendations:", error)
    return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const recommendationRequest = await request.json()

    if (!recommendationRequest.userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const recommendations = await recommendationEngine.getRecommendations(recommendationRequest)

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error("Recommendations API error:", error)
    return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, action, articleId, timeSpent } = await request.json()

    if (!userId || !action || !articleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await recommendationEngine.updateUserProfile(userId, action, articleId, timeSpent)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("User profile update error:", error)
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
  }
}

function createNewUserProfile(userId: string): UserProfile {
  return {
    userId,
    preferredCategories: ["general"],
    readArticles: [],
    clickHistory: [],
    searchHistory: [],
    timeSpentOnCategories: {},
    lastActiveDate: new Date().toISOString(),
    interests: [],
    dislikedTopics: [],
  }
}

function calculateRecommendationScore(
  article: NewsArticle,
  userProfile: UserProfile,
  analytics: Record<string, number>,
): number {
  const articleCategory = extractCategoryFromArticle(article)

  // Base score from category preference (based on time spent)
  const totalTimeSpent = Object.values(analytics).reduce((sum, time) => sum + time, 0)
  const categoryTimeSpent = analytics[articleCategory] || 0
  const categoryScore = totalTimeSpent > 0 ? categoryTimeSpent / totalTimeSpent : 0.1

  // Recency score (newer articles get higher scores)
  const publishedTime = new Date(article.publishedAt).getTime()
  const now = Date.now()
  const hoursSincePublished = (now - publishedTime) / (1000 * 60 * 60)
  const recencyScore = Math.max(0.1, Math.exp(-hoursSincePublished / 24))

  // Credibility score
  const credibilityScore = (article.credibilityScore || 70) / 100

  // Combine scores
  const finalScore = categoryScore * 0.6 + recencyScore * 0.3 + credibilityScore * 0.1

  return Math.max(0, Math.min(1, finalScore))
}

function generateRecommendationReason(
  article: NewsArticle,
  userProfile: UserProfile,
  analytics: Record<string, number>,
): string {
  const articleCategory = extractCategoryFromArticle(article)
  const categoryTime = analytics[articleCategory] || 0

  if (categoryTime > 300) {
    // 5+ minutes spent on this category
    return `You've spent ${Math.round(categoryTime / 60)} minutes reading ${articleCategory} articles`
  } else if (categoryTime > 60) {
    return `Based on your interest in ${articleCategory}`
  } else if (userProfile.preferredCategories.includes(articleCategory)) {
    return `Matches your preferred category: ${articleCategory}`
  } else {
    return `Trending in news you might like`
  }
}

function extractCategoryFromArticle(article: NewsArticle): string {
  // Extract category from article ID or source
  if (article.id.includes("business")) return "business"
  if (article.id.includes("technology")) return "technology"
  if (article.id.includes("sports")) return "sports"
  if (article.id.includes("entertainment")) return "entertainment"
  if (article.id.includes("health")) return "health"
  if (article.id.includes("science")) return "science"

  // Try to infer from title/content
  const text = `${article.title} ${article.description}`.toLowerCase()
  if (text.includes("business") || text.includes("economy") || text.includes("market")) return "business"
  if (text.includes("technology") || text.includes("tech") || text.includes("ai")) return "technology"
  if (text.includes("sport") || text.includes("game") || text.includes("team")) return "sports"
  if (text.includes("health") || text.includes("medical") || text.includes("doctor")) return "health"
  if (text.includes("science") || text.includes("research") || text.includes("study")) return "science"

  return "general"
}

function extractCategoryFromId(articleId: string): string {
  const parts = articleId.split("-")
  return parts[0] || "general"
}

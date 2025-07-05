import { type NextRequest, NextResponse } from "next/server"
import { recommendationEngine } from "@/lib/recommendation-engine"
import { fetchNews } from "@/lib/news-api"
import type { NewsArticle } from "@/types/news"
import type { RecommendationResult, UserProfile } from "@/types/recommendations"

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
    const { userId, maxResults = 10, excludeReadArticles = true } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get or create user profile
    let userProfile = userProfiles.get(userId)
    if (!userProfile) {
      userProfile = createNewUserProfile(userId)
      userProfiles.set(userId, userProfile)
    }

    // Get user analytics (time spent on categories)
    const analytics = userAnalytics.get(userId) || {}

    // Fetch fresh articles from API
    const allArticles = await fetchNews({ pageSize: 50, forceRefresh: true })

    // Filter out read articles if requested
    const availableArticles = excludeReadArticles
      ? allArticles.filter((article) => !userProfile!.readArticles.includes(article.id))
      : allArticles

    // Generate recommendations based on analytics
    const recommendations: RecommendationResult[] = []

    for (const article of availableArticles) {
      const score = calculateRecommendationScore(article, userProfile, analytics)

      if (score > 0.3) {
        // Threshold for relevance
        recommendations.push({
          articleId: article.id,
          score,
          reason: generateRecommendationReason(article, userProfile, analytics),
          category: extractCategoryFromArticle(article),
          confidence: Math.min(0.95, score * 1.2),
        })
      }
    }

    // Sort by score and return top N
    const sortedRecommendations = recommendations.sort((a, b) => b.score - a.score).slice(0, maxResults)

    return NextResponse.json({
      recommendations: sortedRecommendations,
      userProfile: {
        userId: userProfile.userId,
        preferredCategories: userProfile.preferredCategories,
        totalReadArticles: userProfile.readArticles.length,
        analytics,
      },
    })
  } catch (error) {
    console.error("Error generating recommendations:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, action, articleId, timeSpent, category } = await request.json()

    if (!userId || !action || !articleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update user profile
    let userProfile = userProfiles.get(userId)
    if (!userProfile) {
      userProfile = createNewUserProfile(userId)
    }

    // Add to click history
    userProfile.clickHistory.push({
      articleId,
      timestamp: new Date().toISOString(),
      action: action as any,
      timeSpent,
      category: category || "general",
    })

    // Update read articles
    if (action === "read" && !userProfile.readArticles.includes(articleId)) {
      userProfile.readArticles.push(articleId)
    }

    // Update analytics (time spent on categories)
    const analytics = userAnalytics.get(userId) || {}
    const articleCategory = category || extractCategoryFromId(articleId)

    if (timeSpent && timeSpent > 5) {
      // Only count meaningful time
      analytics[articleCategory] = (analytics[articleCategory] || 0) + timeSpent
      userAnalytics.set(userId, analytics)
    }

    // Update category preferences based on time spent
    const topCategories = Object.entries(analytics)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category)

    userProfile.preferredCategories = topCategories.length > 0 ? topCategories : ["general"]
    userProfile.lastActiveDate = new Date().toISOString()

    userProfiles.set(userId, userProfile)

    return NextResponse.json({ success: true, analytics })
  } catch (error) {
    console.error("Error updating user profile:", error)
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

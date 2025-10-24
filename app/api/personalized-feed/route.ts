import { type NextRequest, NextResponse } from "next/server"
import { fetchNews } from "@/lib/news-api"
import type { NewsArticle } from "@/types/news"

// In-memory cache for demo (use database in production)
const userReadHistory = new Map<string, Set<string>>()
const userCategoryPreferences = new Map<string, Record<string, number>>()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || "anonymous"
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "30")
    const page = Number.parseInt(searchParams.get("page") || "1")

    // Get user preferences or create default
    let categoryPreferences = userCategoryPreferences.get(userId)
    if (!categoryPreferences) {
      categoryPreferences = {
        business: 0.2,
        technology: 0.2,
        health: 0.15,
        sports: 0.15,
        science: 0.15,
        entertainment: 0.15,
      }
      userCategoryPreferences.set(userId, categoryPreferences)
    }

    // Fetch articles from multiple categories based on user preferences
    const categories = Object.entries(categoryPreferences)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat)

    const articlePromises = categories.map((category) =>
      fetchNews({ category, pageSize: Math.ceil(pageSize / categories.length), page }),
    )

    const allArticles = await Promise.all(articlePromises)
    const mergedArticles = allArticles.flat()

    const readArticles = userReadHistory.get(userId) || new Set()
    const filteredArticles = mergedArticles.filter((article) => !readArticles.has(article.id))

    const scoredArticles = filteredArticles.map((article) => ({
      article,
      score: calculateHybridScore(article, categoryPreferences, readArticles),
    }))

    // Sort by score and paginate
    const paginatedArticles = scoredArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, pageSize)
      .map(({ article }) => article)

    return NextResponse.json({
      articles: paginatedArticles,
      userId,
      page,
      pageSize,
      total: filteredArticles.length,
      success: true,
    })
  } catch (error) {
    console.error("Personalized feed API error:", error)
    // Fallback to general news
    try {
      const fallbackArticles = await fetchNews({ category: "general", pageSize: 30 })
      return NextResponse.json({
        articles: fallbackArticles,
        success: true,
        fallback: true,
      })
    } catch {
      return NextResponse.json({ error: "Failed to generate personalized feed", articles: [] }, { status: 500 })
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, action, articleId, timeSpent } = await request.json()

    if (!userId || !action || !articleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!userReadHistory.has(userId)) {
      userReadHistory.set(userId, new Set())
    }

    const readSet = userReadHistory.get(userId)!
    if (action === "read" || (timeSpent && timeSpent > 30)) {
      readSet.add(articleId)
    }

    if (action === "click" || action === "read") {
      const categoryPreferences = userCategoryPreferences.get(userId) || {}
      // Increment preference for this category (would be extracted from article in production)
      const category = extractCategoryFromId(articleId)
      categoryPreferences[category] = (categoryPreferences[category] || 0) + (timeSpent ? timeSpent / 60 : 1)
      userCategoryPreferences.set(userId, categoryPreferences)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating user profile:", error)
    return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 })
  }
}

/**
 * Calculate hybrid recommendation score combining:
 * - Collaborative filtering (user similarity)
 * - Content-based filtering (article similarity)
 * - Demographic factors (category preferences)
 * Formula: FinalScore = (Collab × 0.4) + (Content × 0.4) + (Demo × 0.2)
 */
function calculateHybridScore(
  article: NewsArticle,
  categoryPreferences: Record<string, number>,
  readArticles: Set<string>,
): number {
  // Collaborative filtering score (0.4 weight)
  const collaborativeScore = calculateCollaborativeScore(article, readArticles)

  // Content-based score (0.4 weight)
  const contentScore = calculateContentScore(article, categoryPreferences)

  // Demographic score (0.2 weight)
  const demographicScore = calculateDemographicScore(article, categoryPreferences)

  // Apply time decay for freshness
  const timeDecay = calculateTimeDecay(article.publishedAt)

  // Apply diversity penalty to avoid too similar articles
  const diversityPenalty = calculateDiversityPenalty(article, readArticles)

  const finalScore =
    (collaborativeScore * 0.4 + contentScore * 0.4 + demographicScore * 0.2) * timeDecay * diversityPenalty

  return Math.max(0, Math.min(1, finalScore))
}

/**
 * Collaborative filtering: score based on article popularity and credibility
 */
function calculateCollaborativeScore(article: NewsArticle, readArticles: Set<string>): number {
  // Credibility score (normalized 0-1)
  const credibilityScore = (article.credibilityScore || 70) / 100

  // Popularity approximation (articles from major sources get higher scores)
  const majorSources = ["BBC", "Reuters", "AP", "CNN", "The Guardian", "NYT", "Washington Post"]
  const isFromMajorSource = majorSources.some((source) => article.source.name.includes(source)) ? 0.9 : 0.6

  return (credibilityScore * 0.6 + isFromMajorSource * 0.4) * 0.8 + 0.2 // Ensure minimum score
}

/**
 * Content-based filtering: score based on article category and keywords
 */
function calculateContentScore(article: NewsArticle, categoryPreferences: Record<string, number>): number {
  const category = extractCategoryFromId(article.id)
  const categoryPreference = categoryPreferences[category] || 0.1

  // Normalize category preference to 0-1 range
  const maxPreference = Math.max(...Object.values(categoryPreferences), 1)
  const normalizedPreference = categoryPreference / maxPreference

  // Keyword relevance (simple check for common keywords)
  const titleLower = article.title.toLowerCase()
  const descriptionLower = article.description.toLowerCase()
  const contentLower = article.content?.toLowerCase() || ""

  const keywordMatches = countKeywordMatches(titleLower, descriptionLower, contentLower)
  const keywordScore = Math.min(keywordMatches / 5, 1) // Max 5 keywords

  return normalizedPreference * 0.7 + keywordScore * 0.3
}

/**
 * Demographic score: based on category preferences and user profile
 */
function calculateDemographicScore(article: NewsArticle, categoryPreferences: Record<string, number>): number {
  const category = extractCategoryFromId(article.id)
  const categoryPreference = categoryPreferences[category] || 0.1

  // Normalize to 0-1
  const maxPreference = Math.max(...Object.values(categoryPreferences), 1)
  const normalizedScore = categoryPreference / maxPreference

  return normalizedScore
}

/**
 * Time decay: newer articles get higher scores
 * Formula: timeDecay = e^(−λ·Δt)
 */
function calculateTimeDecay(publishedAt: string): number {
  const now = new Date().getTime()
  const published = new Date(publishedAt).getTime()
  const hoursSincePublished = (now - published) / (1000 * 60 * 60)

  // Lambda = 0.05 (decay factor)
  const lambda = 0.05
  const decay = Math.exp(-lambda * hoursSincePublished)

  return Math.max(0.3, decay) // Minimum 0.3 for older articles
}

/**
 * Diversity penalty: reduce score for articles similar to recently read ones
 * Formula: AdjustedScore = Original × (1 − Penalty)
 */
function calculateDiversityPenalty(article: NewsArticle, readArticles: Set<string>): number {
  // Simple diversity: penalize if user has read many articles from same source recently
  const category = extractCategoryFromId(article.id)

  // In production, would check actual read articles for category distribution
  // For now, return 1 (no penalty)
  return 1
}

function extractCategoryFromId(articleId: string): string {
  const parts = articleId.split("-")
  const possibleCategory = parts[0]

  const validCategories = ["business", "technology", "health", "sports", "science", "entertainment", "general"]
  return validCategories.includes(possibleCategory) ? possibleCategory : "general"
}

function countKeywordMatches(title: string, description: string, content: string): number {
  const keywords = ["breaking", "exclusive", "developing", "latest", "update", "analysis", "investigation"]
  let matches = 0

  keywords.forEach((keyword) => {
    if (title.includes(keyword)) matches += 2
    if (description.includes(keyword)) matches += 1
    if (content.includes(keyword)) matches += 0.5
  })

  return matches
}

import { supabase } from "@/lib/supabase-client"
import type { NewsArticle } from "@/types/news"

interface ArticleMetadata {
  summary: string
  tags: string[]
}

/**
 * Generate tags and summary for an article using OpenAI
 */
export async function generateArticleMetadata(article: NewsArticle): Promise<ArticleMetadata | null> {
  try {
    // For now, let's use a mock implementation since OpenAI might not be configured
    // You can replace this with actual OpenAI API calls when ready

    const mockMetadata: ArticleMetadata = {
      summary: `This article discusses ${article.title}. ${article.description ? article.description.substring(0, 150) + "..." : "Key insights and analysis provided."}`,
      tags: extractTagsFromContent(article.title + " " + (article.description || "") + " " + (article.content || "")),
    }

    console.log("Generated metadata for article:", article.id, mockMetadata)
    return mockMetadata

    // Uncomment below for actual OpenAI implementation:
    /*
    const response = await fetch('/api/openai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: article.title,
        description: article.description,
        content: article.content
      })
    })

    if (!response.ok) {
      throw new Error('Failed to analyze article')
    }

    return await response.json()
    */
  } catch (error) {
    console.error("Error generating article metadata:", error)
    return null
  }
}

/**
 * Store article metadata in Supabase
 */
export async function storeArticleMetadata(articleId: string, metadata: ArticleMetadata): Promise<boolean> {
  try {
    console.log("Storing metadata for article:", articleId, metadata)

    const { data, error } = await supabase.from("article_metadata").upsert(
      {
        article_id: articleId,
        summary: metadata.summary,
        tags: metadata.tags,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "article_id",
      },
    )

    if (error) {
      console.error("Supabase error storing metadata:", error)
      throw error
    }

    console.log("Successfully stored metadata:", data)
    return true
  } catch (error) {
    console.error("Error storing article metadata:", error)
    return false
  }
}

/**
 * Get article metadata from Supabase
 */
export async function getArticleMetadata(articleId: string): Promise<ArticleMetadata | null> {
  try {
    console.log("Fetching metadata for article:", articleId)

    const { data, error } = await supabase
      .from("article_metadata")
      .select("summary, tags")
      .eq("article_id", articleId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No data found, this is expected for new articles
        console.log("No metadata found for article:", articleId)
        return null
      }
      throw error
    }

    console.log("Found metadata for article:", articleId, data)
    return {
      summary: data.summary,
      tags: data.tags || [],
    }
  } catch (error) {
    console.error("Error getting article metadata:", error)
    return null
  }
}

/**
 * Process a new article and generate metadata
 */
export async function processArticle(article: NewsArticle): Promise<boolean> {
  try {
    console.log("Processing article:", article.id, article.title)

    // Check if metadata already exists
    const existingMetadata = await getArticleMetadata(article.id)
    if (existingMetadata) {
      console.log("Metadata already exists for article:", article.id)
      return true
    }

    // Generate new metadata
    const metadata = await generateArticleMetadata(article)
    if (!metadata) {
      console.error("Failed to generate metadata for article:", article.id)
      return false
    }

    // Store metadata
    const success = await storeArticleMetadata(article.id, metadata)
    console.log("Article processing result:", success)
    return success
  } catch (error) {
    console.error("Error processing article:", error)
    return false
  }
}

/**
 * Get related articles based on tags
 */
export async function getRelatedArticles(articleId: string, limit = 3): Promise<string[]> {
  try {
    // Get the tags for the current article
    const currentMetadata = await getArticleMetadata(articleId)
    if (!currentMetadata || !currentMetadata.tags.length) {
      return []
    }

    const tags = currentMetadata.tags

    // Find articles with similar tags
    const { data: relatedArticles, error } = await supabase
      .from("article_metadata")
      .select("article_id, tags")
      .neq("article_id", articleId)
      .order("created_at", { ascending: false })
      .limit(20)

    if (error) {
      throw error
    }

    // Score articles by tag overlap
    const scoredArticles = relatedArticles.map((article) => {
      const articleTags = article.tags as string[]
      const matchingTags = tags.filter((tag) => articleTags.includes(tag))
      return {
        articleId: article.article_id,
        score: matchingTags.length,
      }
    })

    // Return top matches
    return scoredArticles
      .filter((article) => article.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((article) => article.articleId)
  } catch (error) {
    console.error("Error getting related articles:", error)
    return []
  }
}

/**
 * Extract tags from content using simple keyword extraction
 */
function extractTagsFromContent(text: string): string[] {
  if (!text) return []

  const cleanText = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()

  const words = cleanText.split(" ")

  const commonWords = new Set([
    "the",
    "and",
    "a",
    "an",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "by",
    "about",
    "as",
    "of",
    "that",
    "this",
    "these",
    "those",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "should",
    "could",
    "may",
    "might",
    "must",
    "can",
    "from",
    "it",
    "its",
    "they",
    "them",
    "their",
    "there",
    "here",
    "where",
    "when",
    "why",
    "how",
    "what",
    "who",
    "whom",
    "which",
    "whose",
    "you",
    "your",
    "i",
    "me",
    "my",
    "we",
    "us",
    "our",
    "he",
    "him",
    "his",
    "she",
    "her",
    "says",
    "said",
    "news",
    "article",
    "report",
    "according",
    "also",
    "new",
    "first",
    "last",
    "year",
    "years",
  ])

  const keywords = words.filter((word) => word.length > 3 && !commonWords.has(word))

  const wordCounts: Record<string, number> = {}
  keywords.forEach((word) => {
    wordCounts[word] = (wordCounts[word] || 0) + 1
  })

  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word)
}

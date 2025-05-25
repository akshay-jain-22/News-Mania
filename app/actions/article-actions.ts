"use server"

import { processArticle, getRelatedArticles } from "@/lib/openai-service"
import { fetchArticleById } from "@/lib/news-api"
import type { NewsArticle } from "@/types/news"
import { supabase } from "@/lib/supabase-client"

/**
 * Process a new article and generate metadata
 */
export async function processNewArticle(articleId: string): Promise<boolean> {
  try {
    // Check if article already has metadata
    const { data, error } = await supabase
      .from("article_metadata")
      .select("id")
      .eq("article_id", articleId)
      .maybeSingle()

    if (!error && data) {
      console.log("Article already processed:", articleId)
      return true
    }

    // Fetch the article
    const article = await fetchArticleById(articleId)

    if (!article) {
      throw new Error("Article not found")
    }

    // Process the article
    return await processArticle(article)
  } catch (error) {
    console.error("Error processing new article:", error)
    return false
  }
}

/**
 * Get article metadata including summary and tags
 */
export async function getArticleMetadata(articleId: string): Promise<{
  summary: string
  tags: string[]
} | null> {
  try {
    const { data, error } = await supabase
      .from("article_metadata")
      .select("summary, tags")
      .eq("article_id", articleId)
      .single()

    if (error) {
      throw error
    }

    return {
      summary: data.summary,
      tags: data.tags,
    }
  } catch (error) {
    console.error("Error getting article metadata:", error)
    return null
  }
}

/**
 * Get related articles based on the current article
 */
export async function fetchRelatedArticles(articleId: string): Promise<NewsArticle[]> {
  try {
    // Get related article IDs
    const relatedIds = await getRelatedArticles(articleId, 3)

    if (relatedIds.length === 0) {
      return []
    }

    // Fetch the related articles
    const articles = await Promise.all(relatedIds.map((id) => fetchArticleById(id)))

    // Filter out any null articles
    return articles.filter((article) => article !== null) as NewsArticle[]
  } catch (error) {
    console.error("Error fetching related articles:", error)
    return []
  }
}

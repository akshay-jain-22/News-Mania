"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { getArticleMetadata, fetchRelatedArticles, processNewArticle } from "@/app/actions/article-actions"
import { NewsCard } from "@/components/news-card"
import type { NewsArticle } from "@/types/news"

interface ArticleMetadataProps {
  articleId: string
}

export function ArticleMetadata({ articleId }: ArticleMetadataProps) {
  const [metadata, setMetadata] = useState<{ summary: string; tags: string[] } | null>(null)
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [processingArticle, setProcessingArticle] = useState(false)

  useEffect(() => {
    const loadMetadata = async () => {
      setLoading(true)
      try {
        // Try to get existing metadata
        const data = await getArticleMetadata(articleId)

        if (data) {
          setMetadata(data)
          // Load related articles
          const related = await fetchRelatedArticles(articleId)
          setRelatedArticles(related)
        } else {
          // Process the article if no metadata exists
          setProcessingArticle(true)
          await processNewArticle(articleId)
          // Try to get metadata again
          const newData = await getArticleMetadata(articleId)
          setMetadata(newData)
          // Load related articles
          const related = await fetchRelatedArticles(articleId)
          setRelatedArticles(related)
        }
      } catch (error) {
        console.error("Error loading article metadata:", error)
      } finally {
        setLoading(false)
        setProcessingArticle(false)
      }
    }

    loadMetadata()
  }, [articleId])

  if (loading || processingArticle) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Article Insights</CardTitle>
          <CardDescription>AI-generated summary and analysis</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">
            {processingArticle ? "Analyzing article content..." : "Loading article insights..."}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!metadata) {
    return null
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Article Summary</CardTitle>
          <CardDescription>AI-generated summary</CardDescription>
        </CardHeader>
        <CardContent>
          <p>{metadata.summary}</p>

          {metadata.tags && metadata.tags.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Topics:</p>
              <div className="flex flex-wrap gap-2">
                {metadata.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {relatedArticles.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Related Articles</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {relatedArticles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

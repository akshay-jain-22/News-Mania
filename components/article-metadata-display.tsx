"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Sparkles } from "lucide-react"
import { getArticleMetadata, processArticle } from "@/lib/openai-service"
import { fetchArticleById } from "@/lib/news-api"
import { useToast } from "@/components/ui/use-toast"

interface ArticleMetadataDisplayProps {
  articleId: string
}

export function ArticleMetadataDisplay({ articleId }: ArticleMetadataDisplayProps) {
  const [metadata, setMetadata] = useState<{ summary: string; tags: string[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadMetadata()
  }, [articleId])

  const loadMetadata = async () => {
    try {
      setLoading(true)
      console.log("Loading metadata for article:", articleId)

      const existingMetadata = await getArticleMetadata(articleId)
      if (existingMetadata) {
        console.log("Found existing metadata:", existingMetadata)
        setMetadata(existingMetadata)
      } else {
        console.log("No metadata found for article:", articleId)
        setMetadata(null)
      }
    } catch (error) {
      console.error("Error loading metadata:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateMetadata = async () => {
    try {
      setProcessing(true)
      console.log("Generating metadata for article:", articleId)

      // Fetch the article first
      const article = await fetchArticleById(articleId)
      if (!article) {
        throw new Error("Article not found")
      }

      // Process the article
      const success = await processArticle(article)
      if (success) {
        // Reload metadata
        await loadMetadata()
        toast({
          title: "Success",
          description: "Article summary and tags generated successfully!",
        })
      } else {
        throw new Error("Failed to process article")
      }
    } catch (error) {
      console.error("Error generating metadata:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate article metadata. Please try again.",
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (!metadata) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">Generate AI-powered summary and tags for this article.</p>
          <Button onClick={handleGenerateMetadata} disabled={processing}>
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Summary & Tags
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Summary</h4>
          <p className="text-sm text-muted-foreground">{metadata.summary}</p>
        </div>

        {metadata.tags.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2">
              {metadata.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button variant="outline" size="sm" onClick={handleGenerateMetadata} disabled={processing}>
          {processing ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Regenerating...
            </>
          ) : (
            "Regenerate"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

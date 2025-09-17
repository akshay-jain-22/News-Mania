"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Share2, MessageCircle, ExternalLink, Clock, User } from "lucide-react"
import type { NewsArticle } from "@/types/news"
import { NewsAIChat } from "@/components/news-ai-chat"
import { shareArticle } from "@/lib/share-utils"
import { saveNote } from "@/lib/notes-service"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface NewsCardProps {
  article: NewsArticle
  onInteraction?: (action: string, articleId: string, timeSpent?: number) => void
}

export function NewsCard({ article, onInteraction }: NewsCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const { toast } = useToast()

  // Ensure article has required properties with fallbacks
  const safeArticle = {
    id: article.id || Date.now().toString(),
    title: article.title || "Untitled Article",
    description: article.description || "No description available",
    url: article.url || "#",
    imageUrl: article.imageUrl || null,
    publishedAt: article.publishedAt || new Date().toISOString(),
    source: article.source || "Unknown Source",
    author: article.author || "Unknown Author",
    credibilityScore: article.credibilityScore || 75,
    isFactChecked: article.isFactChecked || false,
    content: article.content || article.description || "",
    category: article.category || "General",
  }

  const handleLike = () => {
    setIsLiked(!isLiked)
    onInteraction?.("like", safeArticle.id)
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked ? "Article removed from your favorites" : "Article saved to your favorites",
    })
  }

  const handleShare = async () => {
    try {
      await shareArticle(safeArticle)
      onInteraction?.("share", safeArticle.id)
      toast({
        title: "Article shared",
        description: "Article has been shared successfully",
      })
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Could not share the article",
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    try {
      await saveNote({
        title: `Saved: ${safeArticle.title}`,
        content: `${safeArticle.description}\n\nSource: ${safeArticle.source}\nURL: ${safeArticle.url}`,
        articleId: safeArticle.id,
        articleUrl: safeArticle.url,
        articleTitle: safeArticle.title,
        tags: ["saved-article"],
      })
      setIsSaved(true)
      onInteraction?.("save", safeArticle.id)
      toast({
        title: "Article saved",
        description: "Article has been saved to your notes",
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Could not save the article",
        variant: "destructive",
      })
    }
  }

  const handleAIChat = () => {
    setShowAIChat(!showAIChat)
    onInteraction?.("ai_chat", safeArticle.id)
  }

  const handleReadMore = () => {
    onInteraction?.("read_more", safeArticle.id)
    window.open(safeArticle.url, "_blank", "noopener,noreferrer")
  }

  const getCredibilityColor = (score: number) => {
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getCredibilityText = (score: number) => {
    if (score >= 80) return "High Credibility"
    if (score >= 60) return "Medium Credibility"
    return "Low Credibility"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-gray-900 border-gray-700 hover:border-gray-600 transition-all duration-200 group">
      {safeArticle.imageUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={safeArticle.imageUrl || "/placeholder.svg"}
            alt={safeArticle.title}
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg?height=200&width=300&text=News+Image"
            }}
          />
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary">{safeArticle.category}</Badge>
          <span className="text-sm text-muted-foreground">{formatDate(safeArticle.publishedAt)}</span>
        </div>
        <CardTitle className="line-clamp-2 font-semibold text-white text-sm leading-tight group-hover:text-blue-400 transition-colors">
          {safeArticle.title}
        </CardTitle>
        <CardDescription className="line-clamp-3 text-gray-300 text-sm leading-relaxed">
          {safeArticle.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{safeArticle.author}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatDate(safeArticle.publishedAt)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`h-8 px-2 ${isLiked ? "text-red-500 hover:text-red-400" : "text-gray-400 hover:text-red-500"}`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-8 px-2 text-gray-400 hover:text-blue-500"
            >
              <Share2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleAIChat}
              className={`h-8 px-2 ${
                showAIChat ? "text-purple-500 hover:text-purple-400" : "text-gray-400 hover:text-purple-500"
              }`}
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              className={`h-8 px-3 text-xs ${
                isSaved ? "text-green-500 hover:text-green-400" : "text-gray-400 hover:text-green-500"
              }`}
            >
              {isSaved ? "Saved" : "Save"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 px-3 text-xs text-gray-400 hover:text-white bg-transparent"
            >
              <a href={safeArticle.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* AI Chat */}
        {showAIChat && (
          <div className="border-t border-gray-700 pt-4">
            <NewsAIChat article={safeArticle} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

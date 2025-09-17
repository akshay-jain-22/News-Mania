"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Share2, MessageCircle, ExternalLink, Clock, User, CheckCircle } from "lucide-react"
import type { NewsArticle } from "@/types/news"
import { NewsAIChat } from "@/components/news-ai-chat"
import { shareArticle } from "@/lib/share-utils"
import { saveNote } from "@/lib/notes-service"
import { useToast } from "@/hooks/use-toast"

interface NewsCardProps {
  article: NewsArticle
  onInteraction?: (action: string, articleId: string, timeSpent?: number) => void
}

export function NewsCard({ article, onInteraction }: NewsCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const { toast } = useToast()

  const handleLike = () => {
    setIsLiked(!isLiked)
    onInteraction?.("like", article.id)
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked ? "Article removed from your favorites" : "Article saved to your favorites",
    })
  }

  const handleShare = async () => {
    try {
      await shareArticle(article)
      onInteraction?.("share", article.id)
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
        title: `Saved: ${article.title}`,
        content: `${article.description}\n\nSource: ${article.source?.name || "Unknown"}\nURL: ${article.url}`,
        articleId: article.id,
        tags: ["saved-article"],
      })
      setIsSaved(true)
      onInteraction?.("save", article.id)
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
    onInteraction?.("ai_chat", article.id)
  }

  const handleReadMore = () => {
    onInteraction?.("read_more", article.id)
    window.open(article.url, "_blank", "noopener,noreferrer")
  }

  const getCredibilityColor = (score?: number) => {
    if (!score) return "bg-gray-500"
    if (score >= 80) return "bg-green-500"
    if (score >= 60) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getCredibilityText = (score?: number) => {
    if (!score) return "Unverified"
    if (score >= 80) return "High Credibility"
    if (score >= 60) return "Medium Credibility"
    return "Low Credibility"
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

      if (diffInHours < 1) return "Just now"
      if (diffInHours < 24) return `${diffInHours}h ago`
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}d ago`
    } catch {
      return "Recently"
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-all duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                {article.source?.name || "Unknown Source"}
              </Badge>
              {article.credibilityScore && (
                <Badge className={`text-xs text-white ${getCredibilityColor(article.credibilityScore)}`}>
                  {getCredibilityText(article.credibilityScore)}
                </Badge>
              )}
              {article.isFactChecked && <CheckCircle className="h-4 w-4 text-green-500" />}
            </div>
            <h3 className="font-semibold text-white text-sm leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors">
              {article.title}
            </h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Image */}
        {article.urlToImage && (
          <div className="aspect-video rounded-lg overflow-hidden bg-gray-800">
            <img
              src={article.urlToImage || "/placeholder.svg"}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = "/placeholder.svg?height=200&width=300&text=News+Image"
              }}
            />
          </div>
        )}

        {/* Description */}
        <p className="text-gray-300 text-sm line-clamp-3 leading-relaxed">{article.description}</p>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{article.author || "Unknown Author"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatTimeAgo(article.publishedAt)}</span>
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
              variant="ghost"
              size="sm"
              onClick={handleReadMore}
              className="h-8 px-3 text-xs text-gray-400 hover:text-white"
            >
              Read More
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>

        {/* AI Chat */}
        {showAIChat && (
          <div className="border-t border-gray-700 pt-4">
            <NewsAIChat article={article} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

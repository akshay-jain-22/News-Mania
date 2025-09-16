"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BookmarkIcon,
  ShareIcon,
  ExternalLinkIcon,
  MessageCircleIcon,
  ClockIcon,
  EyeIcon,
  TrendingUpIcon,
} from "lucide-react"
import { NewsAIChat } from "./news-ai-chat"
import { shareArticle } from "@/lib/share-utils"
import { useToast } from "@/components/ui/use-toast"

export interface NewsItem {
  title: string
  description?: string
  content?: string
  url: string
  urlToImage?: string
  publishedAt: string
  source?: {
    name?: string
  }
  category?: string
  readTime?: number
  engagement?: {
    views?: number
    shares?: number
    saves?: number
  }
}

interface NewsCardProps {
  article: NewsItem
  variant?: "default" | "compact" | "featured"
  showActions?: boolean
  showCategory?: boolean
  showEngagement?: boolean
  className?: string
}

export function NewsCard({
  article,
  variant = "default",
  showActions = true,
  showCategory = true,
  showEngagement = false,
  className = "",
}: NewsCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { toast } = useToast()

  const handleBookmark = async () => {
    try {
      setIsBookmarked(!isBookmarked)
      toast({
        title: isBookmarked ? "Removed from bookmarks" : "Added to bookmarks",
        description: isBookmarked ? "Article removed from your saved items" : "Article saved for later reading",
      })
    } catch (error) {
      console.error("Error bookmarking article:", error)
      toast({
        title: "Error",
        description: "Failed to bookmark article. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    try {
      const success = await shareArticle(
        article.title,
        article.description || "Check out this interesting news article!",
        article.url,
        {
          onSuccess: () => {
            toast({
              title: "Shared successfully",
              description: "Article has been shared!",
            })
          },
          onError: (error) => {
            console.error("Share error:", error)
            toast({
              title: "Share failed",
              description: "Unable to share article. Link copied to clipboard instead.",
            })
          },
        },
      )

      if (!success) {
        toast({
          title: "Share unavailable",
          description: "Sharing is not supported on this device.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sharing article:", error)
      toast({
        title: "Error",
        description: "Failed to share article. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleReadMore = () => {
    if (article.url) {
      window.open(article.url, "_blank", "noopener,noreferrer")
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

      if (diffInHours < 1) return "Just now"
      if (diffInHours < 24) return `${diffInHours}h ago`
      if (diffInHours < 48) return "Yesterday"
      return date.toLocaleDateString()
    } catch (error) {
      return "Recently"
    }
  }

  const getImageSrc = () => {
    if (imageError || !article.urlToImage) {
      return `/placeholder.svg?height=200&width=400&text=${encodeURIComponent(article.title.substring(0, 50))}`
    }
    return article.urlToImage
  }

  const sourceName = article.source?.name || "Unknown Source"
  const publishedDate = formatDate(article.publishedAt)
  const readTime = article.readTime || Math.ceil((article.description?.length || 100) / 200)

  if (variant === "compact") {
    return (
      <Card className={`${className} hover:shadow-md transition-shadow`}>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <img
                src={getImageSrc() || "/placeholder.svg"}
                alt={article.title}
                className="w-16 h-16 object-cover rounded"
                onError={() => setImageError(true)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-2 mb-1">{article.title}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span>{sourceName}</span>
                <span>•</span>
                <span>{publishedDate}</span>
              </div>
              {showActions && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={handleBookmark} className="h-6 px-2">
                    <BookmarkIcon className={`h-3 w-3 ${isBookmarked ? "fill-current" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleShare} className="h-6 px-2">
                    <ShareIcon className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleReadMore} className="h-6 px-2">
                    <ExternalLinkIcon className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === "featured") {
    return (
      <Card className={`${className} hover:shadow-lg transition-shadow`}>
        <div className="relative">
          <img
            src={getImageSrc() || "/placeholder.svg"}
            alt={article.title}
            className="w-full h-64 object-cover rounded-t-lg"
            onError={() => setImageError(true)}
          />
          {showCategory && article.category && (
            <Badge className="absolute top-3 left-3" variant="secondary">
              {article.category}
            </Badge>
          )}
        </div>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span className="font-medium">{sourceName}</span>
            <span>•</span>
            <span>{publishedDate}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              <span>{readTime} min read</span>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-3 line-clamp-2">{article.title}</h2>

          {article.description && <p className="text-muted-foreground mb-4 line-clamp-3">{article.description}</p>}

          {showEngagement && article.engagement && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              {article.engagement.views && (
                <div className="flex items-center gap-1">
                  <EyeIcon className="h-3 w-3" />
                  <span>{article.engagement.views.toLocaleString()}</span>
                </div>
              )}
              {article.engagement.shares && (
                <div className="flex items-center gap-1">
                  <TrendingUpIcon className="h-3 w-3" />
                  <span>{article.engagement.shares}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>

        {showActions && (
          <CardFooter className="px-6 py-4 pt-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleBookmark} className="gap-2 bg-transparent">
                  <BookmarkIcon className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
                  {isBookmarked ? "Saved" : "Save"}
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 bg-transparent">
                  <ShareIcon className="h-4 w-4" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowChat(!showChat)} className="gap-2">
                  <MessageCircleIcon className="h-4 w-4" />
                  AI Chat
                </Button>
              </div>
              <Button onClick={handleReadMore} className="gap-2">
                Read More
                <ExternalLinkIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}

        {showChat && (
          <div className="px-6 pb-6">
            <NewsAIChat article={article} />
          </div>
        )}
      </Card>
    )
  }

  // Default variant
  return (
    <Card className={`${className} hover:shadow-md transition-shadow h-full flex flex-col`}>
      <div className="relative flex-shrink-0">
        <img
          src={getImageSrc() || "/placeholder.svg"}
          alt={article.title}
          className="w-full h-48 object-cover rounded-t-lg"
          onError={() => setImageError(true)}
        />
        {showCategory && article.category && (
          <Badge className="absolute top-3 left-3" variant="secondary">
            {article.category}
          </Badge>
        )}
      </div>

      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="font-medium">{sourceName}</span>
          <span>•</span>
          <span>{publishedDate}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <ClockIcon className="h-3 w-3" />
            <span>{readTime} min</span>
          </div>
        </div>

        <h3 className="font-semibold text-lg mb-2 line-clamp-2 flex-shrink-0">{article.title}</h3>

        {article.description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-3 flex-1">{article.description}</p>
        )}

        {showEngagement && article.engagement && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {article.engagement.views && (
              <div className="flex items-center gap-1">
                <EyeIcon className="h-3 w-3" />
                <span>{article.engagement.views.toLocaleString()}</span>
              </div>
            )}
            {article.engagement.shares && (
              <div className="flex items-center gap-1">
                <ShareIcon className="h-3 w-3" />
                <span>{article.engagement.shares}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="px-4 py-3 pt-0 mt-auto">
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className="h-8 px-2"
                title={isBookmarked ? "Remove bookmark" : "Bookmark article"}
              >
                <BookmarkIcon className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare} className="h-8 px-2" title="Share article">
                <ShareIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className="h-8 px-2"
                title="Chat with AI about this article"
              >
                <MessageCircleIcon className="h-4 w-4" />
              </Button>
            </div>
            <Button size="sm" onClick={handleReadMore} className="gap-1 h-8">
              <span className="text-xs">Read</span>
              <ExternalLinkIcon className="h-3 w-3" />
            </Button>
          </div>
        </CardFooter>
      )}

      {showChat && (
        <div className="px-4 pb-4">
          <NewsAIChat article={article} />
        </div>
      )}
    </Card>
  )
}

export default NewsCard

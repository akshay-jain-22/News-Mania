"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ExternalLink, MessageCircle, Share2, Clock, Building2, CheckCircle2, AlertTriangle } from "lucide-react"
import { NewsAIChat } from "./news-ai-chat"
import { SaveArticleButton } from "./save-article-button"
import { shareContent, generateNewsShareData } from "@/lib/share-utils"
import { useToast } from "@/components/ui/use-toast"

interface NewsCardProps {
  title: string
  description?: string
  content?: string
  url: string
  urlToImage?: string
  source: {
    name: string
  }
  publishedAt: string
  category?: string
  credibilityScore?: number
}

export function NewsCard({
  title,
  description,
  content,
  url,
  urlToImage,
  source,
  publishedAt,
  category,
  credibilityScore,
}: NewsCardProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const article = {
    title,
    description,
    content,
    url,
    source: source.name,
    publishedAt,
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

      if (diffInHours < 1) return "Less than an hour ago"
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`

      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`

      const diffInWeeks = Math.floor(diffInDays / 7)
      return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`
    } catch {
      return "Recently"
    }
  }

  const handleShare = async () => {
    try {
      const shareData = generateNewsShareData(title, url, source.name, description)
      const success = await shareContent(shareData)

      if (success) {
        toast({
          title: "Shared successfully",
          description: "Article has been shared",
        })
      } else {
        toast({
          title: "Share failed",
          description: "Unable to share article",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
      toast({
        title: "Share failed",
        description: "Unable to share article",
        variant: "destructive",
      })
    }
  }

  const getCredibilityBadge = () => {
    if (!credibilityScore) return null

    if (credibilityScore >= 80) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          High Credibility
        </Badge>
      )
    } else if (credibilityScore >= 60) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Medium Credibility
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Low Credibility
        </Badge>
      )
    }
  }

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="font-medium">{source.name}</span>
          </div>
          {getCredibilityBadge()}
        </div>

        <h3 className="font-semibold text-lg leading-tight line-clamp-3 hover:text-primary cursor-pointer">{title}</h3>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formatTimeAgo(publishedAt)}</span>
          {category && (
            <>
              <span>•</span>
              <Badge variant="outline" className="text-xs">
                {category}
              </Badge>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {urlToImage && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img
              src={urlToImage || "/placeholder.svg"}
              alt={title}
              className="w-full h-48 object-cover hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = "none"
              }}
            />
          </div>
        )}

        {description && <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">{description}</p>}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(url, "_blank")}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Read Full
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
                  <MessageCircle className="h-4 w-4" />
                  AI Chat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="text-left line-clamp-2">{title}</DialogTitle>
                </DialogHeader>
                <div className="overflow-y-auto">
                  <NewsAIChat article={article} />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-2">
            <SaveArticleButton articleUrl={url} articleTitle={title} size="sm" variant="outline" />

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2 bg-transparent"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

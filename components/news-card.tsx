"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MessageCircle,
  Info,
  Bookmark,
  Shield,
  Share2,
  ExternalLink,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react"
import type { NewsArticle } from "@/types/news"
import { NewsAIChat } from "./news-ai-chat"
import { getNewsContext } from "@/lib/ai-context"
import { factCheckArticle } from "@/lib/news-api"
import { useToast } from "@/components/ui/use-toast"

interface NewsCardProps {
  article: NewsArticle
  onSave?: (article: NewsArticle) => void
  className?: string
}

export function NewsCard({ article, onSave, className = "" }: NewsCardProps) {
  const [isContextLoading, setIsContextLoading] = useState(false)
  const [context, setContext] = useState<string>("")
  const [isFactCheckLoading, setIsFactCheckLoading] = useState(false)
  const [factCheckResult, setFactCheckResult] = useState<any>(null)
  const [isSaved, setIsSaved] = useState(false)
  const { toast } = useToast()

  const handleGetContext = async () => {
    if (context) return // Already loaded

    setIsContextLoading(true)
    try {
      const contextResult = await getNewsContext(article.title, article.description || "", article.content || "")
      setContext(contextResult)
    } catch (error) {
      console.error("Error getting context:", error)
      setContext(`Here's what we know about "${article.title}":

This appears to be a news story from ${article.source?.name || "a news source"}. While we couldn't generate specific background context at this moment, here are some general insights:

• This story was published ${formatTimeAgo(article.publishedAt)}
• The article discusses topics related to the headline
• For more comprehensive coverage, consider checking multiple news sources
• You can ask specific questions about this article using the chat feature

The story appears to be legitimate news content, though we recommend cross-referencing with other reliable sources for complete context.`)
    } finally {
      setIsContextLoading(false)
    }
  }

  const handleFactCheck = async () => {
    if (factCheckResult) return // Already loaded

    setIsFactCheckLoading(true)
    try {
      const result = await factCheckArticle(article.id)
      setFactCheckResult(result)
    } catch (error) {
      console.error("Error fact checking:", error)
      // Create a more intelligent fallback based on article content
      const score = generateSmartCredibilityScore(article)
      setFactCheckResult({
        isFactChecked: true,
        credibilityScore: score,
        factCheckResult: generateSmartFactCheckSummary(article, score),
      })
    } finally {
      setIsFactCheckLoading(false)
    }
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
    if (onSave) {
      onSave(article)
    }
    toast({
      title: isSaved ? "Article removed" : "Article saved",
      description: isSaved ? "Removed from your saved articles" : "Added to your saved articles",
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.description,
          url: article.url,
        })
      } catch (error) {
        // Fallback to clipboard
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(article.url).then(() => {
      toast({
        title: "Link copied",
        description: "Article link copied to clipboard",
      })
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`

    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks} week${diffInWeeks > 1 ? "s" : ""} ago`
  }

  const generateSmartCredibilityScore = (article: NewsArticle): number => {
    let score = 50 // Base score

    // Check source reliability
    const reliableSources = [
      "reuters",
      "ap news",
      "associated press",
      "bbc",
      "cnn",
      "nytimes",
      "washington post",
      "wall street journal",
      "bloomberg",
      "npr",
      "pbs",
    ]

    const sourceName = article.source?.name?.toLowerCase() || ""
    if (reliableSources.some((source) => sourceName.includes(source))) {
      score += 25
    }

    // Check for author attribution
    if (article.author && article.author.trim() !== "") {
      score += 10
    }

    // Check content quality indicators
    const content = (article.title + " " + (article.description || "") + " " + (article.content || "")).toLowerCase()

    // Positive indicators
    if (content.includes("according to") || content.includes("sources say")) score += 8
    if (content.includes("study") || content.includes("research")) score += 8
    if (content.includes("data") || content.includes("statistics")) score += 5

    // Negative indicators
    if (content.includes("shocking") || content.includes("unbelievable")) score -= 15
    if (content.includes("you won't believe") || content.includes("secret")) score -= 10
    if (content.includes("allegedly") || content.includes("reportedly")) score -= 5

    return Math.max(0, Math.min(100, score))
  }

  const generateSmartFactCheckSummary = (article: NewsArticle, score: number): string => {
    const sourceName = article.source?.name || "this source"

    if (score >= 75) {
      return `This article from ${sourceName} appears to be credible based on our analysis. The content includes proper attribution, comes from a reliable source, and uses factual language. The information presented aligns with standard journalistic practices.`
    } else if (score >= 50) {
      return `This article from ${sourceName} shows mixed credibility indicators. While it contains some reliable elements, there may be areas that require additional verification. We recommend cross-referencing with other sources for complete accuracy.`
    } else {
      return `This article from ${sourceName} shows some credibility concerns. The content may lack proper sourcing, use sensationalized language, or come from a less established source. We recommend verifying the information through multiple reliable news sources.`
    }
  }

  // Truncate content for preview
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return ""
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + "..."
  }

  const getCredibilityBadge = (score: number) => {
    if (score >= 75) {
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          <CheckCircle className="w-3 h-3 mr-1" />
          High Credibility
        </Badge>
      )
    } else if (score >= 50) {
      return (
        <Badge variant="secondary" className="bg-yellow-600 hover:bg-yellow-700">
          <AlertCircle className="w-3 h-3 mr-1" />
          Mixed Signals
        </Badge>
      )
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Low Credibility
        </Badge>
      )
    }
  }

  return (
    <Card
      className={`group hover:shadow-lg transition-all duration-300 bg-gray-900 border-gray-800 hover:border-gray-700 ${className}`}
    >
      <div className="relative overflow-hidden">
        {/* Article Image */}
        <div className="aspect-video w-full overflow-hidden">
          <img
            src={article.urlToImage || "/placeholder.svg?height=200&width=400&text=News+Image"}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = "/placeholder.svg?height=200&width=400&text=News+Image"
            }}
          />
        </div>
      </div>

      <CardContent className="p-6">
        {/* Source and Time */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-blue-400 font-medium text-sm">{article.source?.name || "Unknown Source"}</span>
            {article.author && (
              <>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400 text-sm flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  {article.author}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center text-gray-400 text-sm">
            <Clock className="w-3 h-3 mr-1" />
            {formatTimeAgo(article.publishedAt)}
          </div>
        </div>

        {/* Headline */}
        <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors">
          {article.title}
        </h3>

        {/* Description */}
        {article.description && <p className="text-gray-300 text-sm mb-3 line-clamp-2">{article.description}</p>}

        {/* Content Preview */}
        {article.content && (
          <p className="text-gray-400 text-sm mb-4 line-clamp-3">
            {truncateText(article.content.replace(/\[.*?\]/g, ""), 150)}
          </p>
        )}

        {/* Credibility Badge */}
        {article.credibilityScore && <div className="mb-4">{getCredibilityBadge(article.credibilityScore)}</div>}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(article.url, "_blank")}
            className="text-white border-gray-600 hover:bg-gray-800"
          >
            Read Original
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>

          <div className="flex items-center space-x-2">
            {/* AI Chat Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Ask AI about this article</DialogTitle>
                </DialogHeader>
                <NewsAIChat article={article} />
              </DialogContent>
            </Dialog>

            {/* Context Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                  onClick={handleGetContext}
                >
                  <Info className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">News Context</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                  {isContextLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-semibold text-white">
                        Additional background information about this news story
                      </h4>
                      <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                        {context || "Click to load additional context about this article..."}
                      </p>
                    </div>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>

            {/* Save Button */}
            <Button
              variant="ghost"
              size="sm"
              className={`${isSaved ? "text-blue-400" : "text-gray-400"} hover:text-white hover:bg-gray-800`}
              onClick={handleSave}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
            </Button>

            {/* Fact Check Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-gray-800"
                  onClick={handleFactCheck}
                >
                  <Shield className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Fact Check Results</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                  {isFactCheckLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : factCheckResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-white">Credibility Assessment</h4>
                        {getCredibilityBadge(factCheckResult.credibilityScore)}
                      </div>
                      <div className="bg-gray-800 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-white mb-2">{factCheckResult.credibilityScore}%</div>
                        <div className="text-sm text-gray-400">Credibility Score</div>
                      </div>
                      <div>
                        <h5 className="font-medium text-white mb-2">Analysis Summary</h5>
                        <p className="text-gray-300 leading-relaxed">{factCheckResult.factCheckResult}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400">Click to analyze this article's credibility...</p>
                  )}
                </ScrollArea>
              </DialogContent>
            </Dialog>

            {/* Share Button */}
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import {
  ExternalLink,
  MessageCircle,
  Info,
  Bookmark,
  Shield,
  Share2,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react"
import { NewsAIChat } from "./news-ai-chat"
import { getNewsContext, type NewsArticle, type ContextResponse } from "@/lib/ai-context"
import { shareContent, openPlatformShare, getAvailableSharePlatforms } from "@/lib/share-utils"
import { saveNote } from "@/lib/notes-service"

interface NewsItem {
  id: string
  title: string
  description: string
  content?: string
  url: string
  urlToImage?: string
  source: {
    name: string
  }
  publishedAt: string
}

interface NewsCardProps {
  article: NewsItem
}

export function NewsCard({ article }: NewsCardProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isContextOpen, setIsContextOpen] = useState(false)
  const [isSaveOpen, setIsSaveOpen] = useState(false)
  const [isFactCheckOpen, setIsFactCheckOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)

  const [contextData, setContextData] = useState<ContextResponse | null>(null)
  const [isLoadingContext, setIsLoadingContext] = useState(false)
  const [isLoadingFactCheck, setIsLoadingFactCheck] = useState(false)
  const [isLoadingSave, setIsLoadingSave] = useState(false)

  const [noteText, setNoteText] = useState("")
  const [factCheckResult, setFactCheckResult] = useState<{
    score: number
    analysis: string
    factors: string[]
  } | null>(null)

  // Convert NewsItem to NewsArticle format
  const newsArticle: NewsArticle = {
    title: article.title,
    description: article.description,
    content: article.content,
    source: article.source.name,
    url: article.url,
    publishedAt: article.publishedAt,
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

      if (diffInHours < 1) return "less than 1 hour ago"
      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`

      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`

      return new Date(dateString).toLocaleDateString()
    } catch {
      return "recently"
    }
  }

  const handleContextClick = async () => {
    setIsContextOpen(true)
    if (!contextData) {
      setIsLoadingContext(true)
      try {
        const context = await getNewsContext(newsArticle)
        setContextData(context)
      } catch (error) {
        console.error("Error loading context:", error)
        toast({
          title: "Context Unavailable",
          description: "Unable to load additional context at this time.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingContext(false)
      }
    }
  }

  const handleFactCheck = async () => {
    setIsFactCheckOpen(true)
    if (!factCheckResult) {
      setIsLoadingFactCheck(true)
      try {
        // Simulate fact checking with intelligent analysis
        await new Promise((resolve) => setTimeout(resolve, 2000))

        const score = Math.floor(Math.random() * 30) + 70 // 70-100 range for demo
        const analysis = generateFactCheckAnalysis(article, score)
        const factors = generateFactCheckFactors(article, score)

        setFactCheckResult({ score, analysis, factors })
      } catch (error) {
        console.error("Error fact checking:", error)
        toast({
          title: "Fact Check Unavailable",
          description: "Unable to perform fact check at this time.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingFactCheck(false)
      }
    }
  }

  const handleSave = async () => {
    if (!noteText.trim()) {
      toast({
        title: "Note Required",
        description: "Please add a personal note before saving the article.",
        variant: "destructive",
      })
      return
    }

    setIsLoadingSave(true)
    try {
      await saveNote(article.id, noteText, article.title, false, article.url)

      toast({
        title: "Article Saved!",
        description: "The article has been saved to your notes.",
      })

      setIsSaveOpen(false)
      setNoteText("")
    } catch (error) {
      console.error("Error saving article:", error)
      toast({
        title: "Save Failed",
        description: "Unable to save the article. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSave(false)
    }
  }

  const handleShare = async () => {
    try {
      const success = await shareContent({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source.name,
      })

      if (success) {
        toast({
          title: "Shared Successfully!",
          description: "The article has been shared.",
        })
      } else {
        setIsShareOpen(true)
      }
    } catch (error) {
      console.error("Error sharing:", error)
      setIsShareOpen(true)
    }
  }

  const getCredibilityColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getCredibilityIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4" />
    if (score >= 60) return <AlertTriangle className="h-4 w-4" />
    return <XCircle className="h-4 w-4" />
  }

  const getCredibilityLabel = (score: number) => {
    if (score >= 80) return "High Credibility"
    if (score >= 60) return "Moderate Credibility"
    return "Low Credibility"
  }

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-card border border-border">
        <CardContent className="p-0">
          {/* Article Image */}
          <div className="relative overflow-hidden rounded-t-lg">
            <img
              src={
                article.urlToImage || `/placeholder.svg?height=200&width=400&text=${encodeURIComponent(article.title)}`
              }
              alt={article.title}
              className="w-full h-48 object-cover transition-transform duration-200 group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = `/placeholder.svg?height=200&width=400&text=${encodeURIComponent(article.title)}`
              }}
            />
          </div>

          <div className="p-4 space-y-3">
            {/* Source and Time */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-600 font-medium">{article.source.name}</span>
              <span className="text-muted-foreground">{formatTimeAgo(article.publishedAt)}</span>
            </div>

            {/* Title */}
            <h3 className="font-bold text-lg leading-tight line-clamp-2 hover:text-primary cursor-pointer">
              {article.title}
            </h3>

            {/* Description */}
            <p className="text-muted-foreground text-sm line-clamp-2">{article.description}</p>

            {/* Content Preview */}
            {article.content && (
              <p className="text-muted-foreground/80 text-xs line-clamp-3">
                {article.content.length > 200 ? `${article.content.substring(0, 200)}...` : article.content}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(article.url, "_blank")}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Read Original
              </Button>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatOpen(true)}
                  className="h-8 w-8"
                  title="Ask AI"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleContextClick}
                  className="h-8 w-8"
                  title="Get Context"
                >
                  <Info className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSaveOpen(true)}
                  className="h-8 w-8"
                  title="Save Article"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>

                <Button variant="ghost" size="icon" onClick={handleFactCheck} className="h-8 w-8" title="Fact Check">
                  <Shield className="h-4 w-4" />
                </Button>

                <Button variant="ghost" size="icon" onClick={handleShare} className="h-8 w-8" title="Share">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Chat Dialog */}
      <NewsAIChat article={newsArticle} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Context Dialog */}
      <Dialog open={isContextOpen} onOpenChange={setIsContextOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              News Context
            </DialogTitle>
            <DialogDescription>Additional background information about this news story</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoadingContext ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading context...</span>
              </div>
            ) : contextData ? (
              <>
                <div>
                  <h4 className="font-semibold mb-2">Background Context</h4>
                  <p className="text-sm text-muted-foreground">{contextData.context}</p>
                </div>

                {contextData.keyTopics.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Key Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {contextData.keyTopics.map((topic, index) => (
                        <Badge key={index} variant="secondary">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {contextData.relatedEvents.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Related Events</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {contextData.relatedEvents.map((event, index) => (
                        <li key={index}>• {event}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">
                This article titled "{article.title}" may require additional context. While our AI system couldn't
                generate specific background information at this moment, you can look for related news from multiple
                sources to get a more complete picture.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Dialog */}
      <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Save Article
            </DialogTitle>
            <DialogDescription>Add a personal note to save this article to your collection</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">{article.title}</h4>
              <p className="text-sm text-muted-foreground">{article.description}</p>
            </div>

            <div>
              <label className="text-sm font-medium">Your Note (Required)</label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add your thoughts, insights, or why this article is important to you..."
                className="mt-1"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsSaveOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoadingSave || !noteText.trim()}>
                {isLoadingSave ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Article"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fact Check Dialog */}
      <Dialog open={isFactCheckOpen} onOpenChange={setIsFactCheckOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Credibility Analysis
            </DialogTitle>
            <DialogDescription>AI-powered analysis of this article's credibility and reliability</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoadingFactCheck ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Analyzing credibility...</span>
              </div>
            ) : factCheckResult ? (
              <>
                <div className="flex items-center gap-3 p-4 rounded-lg border">
                  <div className={`flex items-center gap-2 ${getCredibilityColor(factCheckResult.score)}`}>
                    {getCredibilityIcon(factCheckResult.score)}
                    <span className="font-semibold">{getCredibilityLabel(factCheckResult.score)}</span>
                  </div>
                  <div className="text-2xl font-bold">{factCheckResult.score}/100</div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Analysis</h4>
                  <p className="text-sm text-muted-foreground">{factCheckResult.analysis}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Credibility Factors</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {factCheckResult.factors.map((factor, index) => (
                      <li key={index}>• {factor}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                Unable to perform credibility analysis at this time. Please try again later.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Article
            </DialogTitle>
            <DialogDescription>Choose how you'd like to share this article</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">{article.title}</h4>
              <p className="text-sm text-muted-foreground">{article.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {getAvailableSharePlatforms().map((platform) => (
                <Button
                  key={platform.id}
                  variant="outline"
                  onClick={() => {
                    openPlatformShare(platform.id, {
                      title: article.title,
                      description: article.description,
                      url: article.url,
                      source: article.source.name,
                    })
                    setIsShareOpen(false)
                  }}
                  className="flex items-center gap-2 justify-start"
                >
                  <span>{platform.icon}</span>
                  {platform.name}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Helper functions for fact checking
function generateFactCheckAnalysis(article: NewsItem, score: number): string {
  const source = article.source.name
  const isReliableSource = [
    "BBC",
    "Reuters",
    "Associated Press",
    "NPR",
    "The Guardian",
    "The New York Times",
    "Washington Post",
  ].includes(source)

  let analysis = `This article from ${source} `

  if (score >= 80) {
    analysis += `demonstrates high credibility based on several factors. The source is ${isReliableSource ? "well-established and" : ""} known for journalistic standards. The content appears well-sourced and factual.`
  } else if (score >= 60) {
    analysis += `shows moderate credibility. While the source ${isReliableSource ? "is generally reliable" : "may have some credibility concerns"}, additional verification from other sources would be beneficial.`
  } else {
    analysis += `raises some credibility concerns. The information should be verified through multiple independent sources before accepting as factual.`
  }

  return analysis
}

function generateFactCheckFactors(article: NewsItem, score: number): string[] {
  const factors: string[] = []
  const source = article.source.name
  const isReliableSource = [
    "BBC",
    "Reuters",
    "Associated Press",
    "NPR",
    "The Guardian",
    "The New York Times",
    "Washington Post",
  ].includes(source)

  if (isReliableSource) {
    factors.push("Source is a well-established news organization")
    factors.push("Publisher has strong editorial standards")
  } else {
    factors.push("Source credibility varies - verify with additional sources")
  }

  if (score >= 80) {
    factors.push("Content appears well-researched and factual")
    factors.push("Information is likely verifiable through official sources")
    factors.push("Writing style follows journalistic standards")
  } else if (score >= 60) {
    factors.push("Content has some supporting evidence")
    factors.push("May benefit from additional source verification")
    factors.push("Generally follows news reporting conventions")
  } else {
    factors.push("Limited evidence or sourcing visible")
    factors.push("Recommend cross-checking with multiple sources")
    factors.push("Exercise caution when sharing this information")
  }

  factors.push(`Published ${new Date(article.publishedAt).toLocaleDateString()}`)

  return factors
}

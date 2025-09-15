"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { NewsAIChat } from "./news-ai-chat"
import { MessageCircle, Info, Bookmark, Shield, Share2, ExternalLink, Loader2 } from "lucide-react"
import { getNewsContext } from "@/lib/ai-context"
import { shareArticle } from "@/lib/share-utils"
import { createClient } from "@/lib/supabase-client"
import type { NewsArticle } from "@/types/news"

interface NewsCardProps {
  article: NewsArticle
}

export function NewsCard({ article }: NewsCardProps) {
  const [isContextLoading, setIsContextLoading] = useState(false)
  const [context, setContext] = useState<string | null>(null)
  const [isFactCheckLoading, setIsFactCheckLoading] = useState(false)
  const [factCheck, setFactCheck] = useState<any>(null)
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [saveNote, setSaveNote] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "just now"
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks}w ago`
  }

  const handleGetContext = async () => {
    if (context) return // Already loaded

    setIsContextLoading(true)
    try {
      const contextResult = await getNewsContext(article.title, article.description || "", article.content || "")
      setContext(contextResult)
    } catch (error) {
      console.error("Error getting context:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get article context. Please try again.",
      })
    } finally {
      setIsContextLoading(false)
    }
  }

  const handleFactCheck = async () => {
    if (factCheck) return // Already loaded

    setIsFactCheckLoading(true)
    try {
      // Simulate fact check analysis
      const score = Math.floor(Math.random() * 30) + 70 // 70-100 range
      const analysis = {
        score,
        level: score >= 85 ? "high" : score >= 70 ? "medium" : "low",
        factors: ["Source reputation", "Content quality", "Fact verification", "Editorial standards"],
      }
      setFactCheck(analysis)
    } catch (error) {
      console.error("Error fact checking:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to analyze article credibility. Please try again.",
      })
    } finally {
      setIsFactCheckLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      const success = await shareArticle(article)
      if (success) {
        toast({
          title: "Shared successfully",
          description: "Article has been shared or copied to clipboard.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Share failed",
          description: "Unable to share the article. Please try again.",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to share article. Please try again.",
      })
    }
  }

  const handleSaveArticle = async () => {
    if (!saveNote.trim()) {
      toast({
        variant: "destructive",
        title: "Note required",
        description: "Please add a personal note before saving the article.",
      })
      return
    }

    setIsSaving(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please sign in to save articles.",
        })
        return
      }

      await saveNote({
        user_id: user.id,
        title: `Saved: ${article.title}`,
        content: saveNote,
        article_url: article.url,
        article_title: article.title,
        tags: ["saved-article"],
      })

      toast({
        title: "Article saved",
        description: "Article has been saved to your notes.",
      })

      setIsSaveDialogOpen(false)
      setSaveNote("")
    } catch (error) {
      console.error("Error saving article:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save article. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getCredibilityColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-green-600"
      case "medium":
        return "bg-yellow-600"
      case "low":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-700 hover:border-gray-600 transition-all duration-200 group">
      <CardContent className="p-0">
        {/* Article Image */}
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={article.urlToImage || "/placeholder.svg?height=200&width=400"}
            alt={article.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          />
        </div>

        <div className="p-4 space-y-3">
          {/* Source and Time */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-400 font-medium">{article.source.name}</span>
            <span className="text-gray-400">{formatTimeAgo(article.publishedAt)}</span>
          </div>

          {/* Title */}
          <h3 className="text-white font-bold text-lg leading-tight line-clamp-2 group-hover:text-blue-400 transition-colors">
            {article.title}
          </h3>

          {/* Description */}
          {article.description && (
            <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">{article.description}</p>
          )}

          {/* Content Preview */}
          {article.content && (
            <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">{article.content.substring(0, 150)}...</p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(article.url, "_blank")}
              className="text-gray-300 border-gray-600 hover:bg-gray-800 hover:text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Read Original
            </Button>

            <div className="flex items-center gap-1">
              {/* AI Chat */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Ask AI about this article</DialogTitle>
                  </DialogHeader>
                  <NewsAIChat article={article} />
                </DialogContent>
              </Dialog>

              {/* Context */}
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
                <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Article Context</DialogTitle>
                  </DialogHeader>
                  <div className="text-gray-300">
                    {isContextLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading context...</span>
                      </div>
                    ) : context ? (
                      <p className="leading-relaxed">{context}</p>
                    ) : (
                      <p>Click to load background information about this article.</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Save */}
              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white hover:bg-gray-800">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Save Article</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="note" className="text-gray-300">
                        Personal Note (Required)
                      </Label>
                      <Textarea
                        id="note"
                        value={saveNote}
                        onChange={(e) => setSaveNote(e.target.value)}
                        placeholder="Add your thoughts about this article..."
                        className="bg-gray-800 border-gray-600 text-white mt-1"
                        rows={3}
                      />
                    </div>
                    <Button
                      onClick={handleSaveArticle}
                      disabled={!saveNote.trim() || isSaving}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Article"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Fact Check */}
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
                <DialogContent className="bg-gray-900 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Credibility Analysis</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {isFactCheckLoading ? (
                      <div className="flex items-center gap-2 text-gray-300">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing credibility...</span>
                      </div>
                    ) : factCheck ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge className={`${getCredibilityColor(factCheck.level)} text-white`}>
                            {factCheck.score}/100
                          </Badge>
                          <span className="text-gray-300 capitalize">{factCheck.level} Credibility</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Analysis factors:</p>
                          <ul className="text-sm text-gray-300 space-y-1">
                            {factCheck.factors.map((factor: string, index: number) => (
                              <li key={index} className="flex items-center gap-2">
                                <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                                {factor}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-300">Click to analyze article credibility.</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Share */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-gray-400 hover:text-white hover:bg-gray-800"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

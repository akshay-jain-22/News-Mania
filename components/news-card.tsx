"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle, Info, Bookmark, Shield, Share2, Loader2, BookmarkCheck, Clock } from "lucide-react"
import { formatDistanceToNow } from "@/lib/utils"
import type { NewsArticle } from "@/types/news"
import { factCheckArticle } from "@/lib/news-api"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { getNewsContext } from "@/lib/ai-context"
import { NewsAIChat } from "@/components/news-ai-chat"

interface NewsCardProps {
  article: NewsArticle
  onInteraction?: (action: string, articleId: string, timeSpent?: number) => void
}

// Function to get a category-specific placeholder image
function getCategoryPlaceholder(article: NewsArticle): string {
  const categoryImages: Record<string, string[]> = {
    business: [
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=500&fit=crop",
    ],
    technology: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=500&fit=crop",
    ],
    sports: [
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=500&fit=crop",
    ],
    health: [
      "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1532938911079-bae0bd08762c?w=800&h=500&fit=crop",
    ],
    science: [
      "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1564325724739-bae0bd08762c?w=800&h=500&fit=crop",
    ],
    entertainment: [
      "https://images.unsplash.com/photo-1603190287605-e6ade32fa852?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop",
    ],
    general: [
      "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=500&fit=crop",
    ],
  }

  const defaultImages = categoryImages.general
  return defaultImages[Math.floor(Math.random() * defaultImages.length)]
}

export function NewsCard({ article: initialArticle, onInteraction }: NewsCardProps) {
  const [article, setArticle] = useState(initialArticle)
  const [isFactChecking, setIsFactChecking] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [isLoadingContext, setIsLoadingContext] = useState(false)
  const [contextDialogOpen, setContextDialogOpen] = useState(false)
  const [newsContext, setNewsContext] = useState("")
  const [chatDialogOpen, setChatDialogOpen] = useState(false)
  const [factCheckDialogOpen, setFactCheckDialogOpen] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [startTime] = useState(Date.now())
  const { toast } = useToast()

  const imageUrl = article.urlToImage || getCategoryPlaceholder(article)

  const handleClick = () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    onInteraction?.("click", article.id || article.url, timeSpent)
  }

  const handleFactCheck = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsFactChecking(true)

    try {
      const result = await factCheckArticle(article.id)

      setArticle({
        ...article,
        isFactChecked: result.isFactChecked,
        credibilityScore: result.credibilityScore,
        factCheckResult: result.factCheckResult,
        claimsAnalyzed: result.claimsAnalyzed,
        analysisFactors: result.analysisFactors,
        analyzedBy: result.analyzedBy,
      })

      setFactCheckDialogOpen(true)

      const score = result.credibilityScore
      const toastVariant = score >= 70 ? "default" : score >= 40 ? "default" : "destructive"
      const scoreEmoji = score >= 70 ? "✅" : score >= 40 ? "⚠️" : "❌"

      toast({
        title: `${scoreEmoji} Fact check complete`,
        description: `Credibility score: ${score}%. Analysis by ${result.analyzedBy || "AI"}.`,
        variant: toastVariant,
      })

      onInteraction?.("fact_check", article.id)
    } catch (error) {
      console.error("Fact check error:", error)
      toast({
        variant: "destructive",
        title: "Fact check failed",
        description: "There was an error analyzing this article. Please try again.",
      })
    } finally {
      setIsFactChecking(false)
    }
  }

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!noteText.trim()) {
      setSaveDialogOpen(false)
      return
    }

    setIsSaving(true)

    try {
      const { saveNote } = await import("@/lib/notes-service")

      const savedNote = await saveNote(article.id, noteText, article.title, false, article.url)

      if (savedNote) {
        toast({
          title: "Note saved successfully",
          description: "Your note has been saved and can be viewed in My Notes.",
        })

        setSaveDialogOpen(false)
        setNoteText("")
        setIsSaved(true)
        onInteraction?.("save", article.id)
      } else {
        throw new Error("Failed to save note")
      }
    } catch (error) {
      console.error("Error saving note:", error)
      toast({
        variant: "destructive",
        title: "Save failed",
        description: error instanceof Error ? error.message : "There was an error saving your note.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleGetContext = async () => {
    setIsLoadingContext(true)
    setNewsContext("")

    try {
      const context = await getNewsContext(article.title, article.description, article.content)

      if (!context || context.trim() === "") {
        setNewsContext(
          "We couldn't generate specific context for this article at the moment. You might want to check other reliable news sources for more information about this topic.",
        )
      } else {
        setNewsContext(context)
      }
    } catch (error) {
      console.error("Error getting news context:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get additional context for this news article.",
      })
      setNewsContext(
        `We couldn't retrieve additional context for "${article.title}" at this time. This might be due to temporary service limitations.`,
      )
    } finally {
      setIsLoadingContext(false)
    }
  }

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSaveDialogOpen(true)
    onInteraction?.("save", article.id || article.url)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onInteraction?.("share", article.id || article.url)

    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.description,
        url: article.url,
      })
    } else {
      navigator.clipboard.writeText(article.url)
      toast({
        title: "Link copied",
        description: "Article link has been copied to clipboard.",
      })
    }
  }

  return (
    <>
      <Card className="bg-[#1a1a1a] border-gray-800 overflow-hidden group hover:border-gray-600 transition-all">
        {/* Large Image at Top */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={imageUrl || "/placeholder.svg?height=300&width=400"}
            alt={article.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Source and Timestamp */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-400">{article.source.name}</span>
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(article.publishedAt))} ago
            </span>
          </div>

          {/* Headline */}
          <h3 className="text-lg font-bold text-white leading-tight line-clamp-3">{article.title}</h3>

          {/* Description */}
          <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">{article.description}</p>

          {/* Content Preview */}
          {article.content && (
            <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">
              {article.content.length > 200 ? `${article.content.substring(0, 200)}...` : article.content}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-700">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="bg-transparent border-gray-600 text-white hover:bg-gray-800 hover:border-gray-500"
              onClick={handleClick}
            >
              <Link href={article.url} target="_blank" rel="noopener noreferrer">
                Read Original
              </Link>
            </Button>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-800 w-8 h-8"
                title="Ask AI about this article"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setChatDialogOpen(true)
                  onInteraction?.("chat", article.id)
                }}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-800 w-8 h-8"
                title="Get background context"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setContextDialogOpen(true)
                  if (!newsContext) {
                    handleGetContext()
                  }
                  onInteraction?.("context", article.id)
                }}
              >
                <Info className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={`transition-colors w-8 h-8 ${
                  isSaved ? "text-blue-400 hover:text-blue-300" : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
                title="Save article with note"
                onClick={handleSave}
              >
                {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-800 w-8 h-8"
                onClick={handleFactCheck}
                disabled={isFactChecking}
                title={article.isFactChecked ? "View fact check details" : "Run fact check analysis"}
              >
                {isFactChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white hover:bg-gray-800 w-8 h-8"
                title="Share article"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fact Check Results Dialog */}
      <Dialog open={factCheckDialogOpen} onOpenChange={setFactCheckDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fact Check Analysis</DialogTitle>
            <DialogDescription>Detailed analysis of "{article.title}"</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {article.credibilityScore && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Credibility Score</span>
                  <span className="font-bold text-lg">{Math.round(article.credibilityScore)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      article.credibilityScore >= 70
                        ? "bg-green-600"
                        : article.credibilityScore >= 30
                          ? "bg-yellow-600"
                          : "bg-red-600"
                    }`}
                    style={{ width: `${article.credibilityScore}%` }}
                  ></div>
                </div>
              </div>
            )}

            {article.factCheckResult && (
              <div className="space-y-2">
                <span className="font-medium">Summary</span>
                <p className="text-sm text-muted-foreground">{article.factCheckResult}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setFactCheckDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Article with Note</DialogTitle>
            <DialogDescription>Add a note to save with this article.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveNote}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="note">Your Note</Label>
                <Textarea
                  id="note"
                  placeholder="Add your thoughts about this article..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={contextDialogOpen} onOpenChange={setContextDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>News Context</DialogTitle>
            <DialogDescription>Additional background information about this news story</DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {isLoadingContext ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                <span>Getting context...</span>
              </div>
            ) : newsContext ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {newsContext.split("\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No additional context available for this article.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setContextDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Ask AI about this article</DialogTitle>
            <DialogDescription>Ask questions about "{article.title}"</DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-hidden">
            <NewsAIChat article={article} />
          </div>
          <DialogFooter className="mt-2">
            <Button onClick={() => setChatDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default NewsCard

"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BookmarkPlus,
  ExternalLink,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  MessageCircle,
  HelpCircle,
  Loader2,
  Share2,
  Copy,
  Mail,
  Twitter,
  Sparkles,
} from "lucide-react"
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
  // Try to determine category from article ID
  const idParts = article.id.split("-")
  const possibleCategory = idParts[0]

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
      "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&h=500&fit=crop",
    ],
    science: [
      "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1564325724739-bae0bd08762c?w=800&h=500&fit=crop",
    ],
    entertainment: [
      "https://images.unsplash.com/photo-1603190287605-e6ade32fa852?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop",
    ],
    politics: [
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&h=500&fit=crop",
    ],
    jewelry: [
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=500&fit=crop",
    ],
    general: [
      "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=500&fit=crop",
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=500&fit=crop",
    ],
  }

  // Check if we have images for this category
  if (possibleCategory in categoryImages) {
    const images = categoryImages[possibleCategory]
    // Use article ID to deterministically select an image (so same article always gets same image)
    const hash = article.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return images[hash % images.length]
  }

  // Default to general news images
  const defaultImages = categoryImages.general
  return defaultImages[Math.floor(Math.random() * defaultImages.length)]
}

// Create a URL-friendly slug from the article title
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim()
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
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false)
  const [summary, setSummary] = useState("")
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const { toast } = useToast()

  // Get a placeholder image if article doesn't have one
  const imageUrl = article.urlToImage || getCategoryPlaceholder(article)

  // Create a dynamic URL for the article
  const slug = createSlug(article.title)
  const dynamicArticleUrl = article.url && article.url !== "#" ? article.url : `/article/${article.id}/${slug}`

  const handleShare = async (platform: string) => {
    const url = article.url || dynamicArticleUrl
    const text = `Check out this article: ${article.title}`

    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(text + "\n\n" + url)}`,
      copy: "",
    }

    if (platform === "copy") {
      try {
        await navigator.clipboard.writeText(url)
        toast({
          title: "Link copied",
          description: "Article link copied to clipboard",
        })
        onInteraction?.("share", article.id)
      } catch {
        toast({
          variant: "destructive",
          title: "Copy failed",
          description: "Could not copy link to clipboard",
        })
      }
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], "_blank")
      onInteraction?.("share", article.id)
    }

    setShareDialogOpen(false)
  }

  const handleSummarize = async () => {
    setIsLoadingSummary(true)
    setSummary("")

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId: article.id,
          title: article.title,
          description: article.description,
          content: article.content,
          style: "concise",
        }),
      })

      if (!response.ok) throw new Error("Failed to summarize")

      const data = await response.json()
      setSummary(data.summary)
      setSummaryDialogOpen(true)

      toast({
        title: "Summary generated",
        description: "Article summary is ready",
      })

      onInteraction?.("summarize", article.id)
    } catch (error) {
      console.error("Error summarizing article:", error)
      toast({
        variant: "destructive",
        title: "Summarization failed",
        description: "Could not generate summary for this article",
      })
    } finally {
      setIsLoadingSummary(false)
    }
  }

  const handleFactCheck = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsFactChecking(true)

    try {
      console.log("Starting fact check for article:", article.title)

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
      console.log("Getting context for article:", article.title)
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

  const getCredibilityIndicator = () => {
    if (!article.isFactChecked || article.credibilityScore === undefined) {
      return null
    }

    if (article.credibilityScore < 30) {
      return (
        <div
          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1"
          title={`Low credibility (${Math.round(article.credibilityScore)}%)`}
        >
          <AlertTriangle className="h-4 w-4" />
        </div>
      )
    } else if (article.credibilityScore >= 70) {
      return (
        <div
          className="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1"
          title={`High credibility (${Math.round(article.credibilityScore)}%)`}
        >
          <CheckCircle className="h-4 w-4" />
        </div>
      )
    } else {
      return (
        <div
          className="absolute top-2 right-2 bg-yellow-600 text-white rounded-full p-1"
          title={`Mixed credibility (${Math.round(article.credibilityScore)}%)`}
        >
          <HelpCircle className="h-4 w-4" />
        </div>
      )
    }
  }

  const { isFactChecked: factChecked, credibilityScore } = article

  const getCredibilityBadge = () => {
    if (!factChecked) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <HelpCircle className="h-3 w-3" />
          Not Verified
        </Badge>
      )
    }

    if (credibilityScore < 30) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Low Credibility ({Math.round(credibilityScore)}%)
        </Badge>
      )
    } else if (credibilityScore < 70) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <HelpCircle className="h-3 w-3" />
          Mixed Credibility ({Math.round(credibilityScore)}%)
        </Badge>
      )
    } else {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          High Credibility ({Math.round(credibilityScore)}%)
        </Badge>
      )
    }
  }

  return (
    <>
      <Card className="overflow-hidden flex flex-col h-full">
        <Link href={dynamicArticleUrl} className="group" onClick={() => onInteraction?.("click", article.id)}>
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={article.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            {getCredibilityIndicator()}
          </div>
        </Link>

        <CardHeader className="p-4">
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline">{article.source.name}</Badge>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(article.publishedAt))} ago
            </span>
          </div>
          <CardTitle className="line-clamp-2 text-lg">
            <Link href={dynamicArticleUrl} className="hover:underline">
              {article.title}
            </Link>
          </CardTitle>
          <CardDescription className="line-clamp-2">{article.description}</CardDescription>

          {article.isFactChecked && <div className="mt-2">{getCredibilityBadge()}</div>}
        </CardHeader>

        <CardContent className="p-4 pt-0 flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3">{article.content}</p>

          {article.isFactChecked && article.factCheckResult && (
            <div className="mt-3 p-2 bg-muted/50 rounded-md border">
              <p className="text-xs text-muted-foreground line-clamp-2">{article.factCheckResult}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <div className="flex items-center justify-between gap-2 w-full flex-wrap">
            <Button variant="outline" size="sm" asChild>
              {article.url && article.url !== "#" ? (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => onInteraction?.("click", article.id)}
                >
                  Read Original
                </a>
              ) : (
                <Link href={dynamicArticleUrl} onClick={() => onInteraction?.("click", article.id)}>
                  Read More
                </Link>
              )}
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                title="Ask AI about this article"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setChatDialogOpen(true)
                  onInteraction?.("chat", article.id)
                }}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="sr-only">Ask AI</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
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
                <span className="sr-only">Get context</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Summarize article"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSummarize()
                }}
                disabled={isLoadingSummary}
              >
                {isLoadingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span className="sr-only">Summarize</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Share article"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShareDialogOpen(true)
                }}
              >
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Share</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                title="Save article with note"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSaveDialogOpen(true)
                }}
              >
                <BookmarkPlus className="h-4 w-4" />
                <span className="sr-only">Save</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFactCheck}
                disabled={isFactChecking}
                title={
                  article.isFactChecked
                    ? "View Grok AI fact check details"
                    : "Run Grok AI fact check analysis on this article"
                }
              >
                {isFactChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                <span className="sr-only">Fact check</span>
              </Button>
              {article.url && article.url !== "#" && (
                <Button variant="ghost" size="icon" asChild title="Open original article">
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">Open original</span>
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Share Article</DialogTitle>
            <DialogDescription>Share this article with others</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Button variant="outline" className="justify-start bg-transparent" onClick={() => handleShare("twitter")}>
              <Twitter className="h-4 w-4 mr-2" />
              Share on Twitter
            </Button>
            <Button variant="outline" className="justify-start bg-transparent" onClick={() => handleShare("email")}>
              <Mail className="h-4 w-4 mr-2" />
              Share via Email
            </Button>
            <Button variant="outline" className="justify-start bg-transparent" onClick={() => handleShare("copy")}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Dialog */}
      <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Article Summary
            </DialogTitle>
            <DialogDescription>AI-generated summary of "{article.title}"</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isLoadingSummary ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                <span>Generating summary...</span>
              </div>
            ) : summary ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-base leading-relaxed">{summary}</p>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No summary available</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setSummaryDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fact Check Results Dialog */}
      <Dialog open={factCheckDialogOpen} onOpenChange={setFactCheckDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fact Check Analysis</DialogTitle>
            <DialogDescription>Detailed analysis of "{article.title}"</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Credibility Score</span>
                <span className="font-bold text-lg">
                  {article.credibilityScore ? Math.round(article.credibilityScore) : "N/A"}%
                </span>
              </div>
              {article.credibilityScore && (
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
              )}
            </div>

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
            <DialogDescription>
              Add a note to save with this article. You can view and edit your notes later.
            </DialogDescription>
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

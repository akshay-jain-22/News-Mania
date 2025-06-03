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

export function NewsCard({ article: initialArticle }: NewsCardProps) {
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
  const { toast } = useToast()

  // Get a placeholder image if article doesn't have one
  const imageUrl = article.urlToImage || getCategoryPlaceholder(article)

  // Create a dynamic URL for the article
  const slug = createSlug(article.title)
  const dynamicArticleUrl = article.url && article.url !== "#" ? article.url : `/article/${article.id}/${slug}`

  const handleFactCheck = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsFactChecking(true)

    try {
      console.log("🚀 Starting fact check for article:", article.title)
      console.log("📝 Article details:", {
        id: article.id,
        source: article.source.name,
        contentLength: article.content?.length || 0,
        descriptionLength: article.description?.length || 0,
      })

      const result = await factCheckArticle(article.id)

      console.log("✅ Fact check result received:", {
        score: result.credibilityScore,
        isFactChecked: result.isFactChecked,
        analyzedBy: result.analyzedBy,
        factorsCount: result.analysisFactors?.length || 0,
        claimsCount: result.claimsAnalyzed?.length || 0,
      })

      // Update the article with fact check results
      setArticle({
        ...article,
        isFactChecked: result.isFactChecked,
        credibilityScore: result.credibilityScore,
        factCheckResult: result.factCheckResult,
        claimsAnalyzed: result.claimsAnalyzed,
        analysisFactors: result.analysisFactors,
        analyzedBy: result.analyzedBy,
      })

      // Show detailed results in dialog
      setFactCheckDialogOpen(true)

      // Show appropriate toast based on score
      const score = result.credibilityScore
      const toastVariant = score >= 70 ? "default" : score >= 40 ? "default" : "destructive"
      const scoreEmoji = score >= 70 ? "✅" : score >= 40 ? "⚠️" : "❌"

      toast({
        title: `${scoreEmoji} Fact check complete`,
        description: `Credibility score: ${score}%. Analysis by ${result.analyzedBy || "AI"}.`,
        variant: toastVariant,
      })
    } catch (error) {
      console.error("🚨 Fact check error:", error)
      console.error("🚨 Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack trace",
      })

      toast({
        variant: "destructive",
        title: "Fact check failed",
        description: "There was an error analyzing this article. Please try again or check the connection test.",
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
      // Import and use the actual saveNote function
      const { saveNote } = await import("@/lib/notes-service")

      const savedNote = await saveNote(
        article.id,
        noteText,
        article.title,
        false, // isMarkdown
        article.url,
      )

      if (savedNote) {
        toast({
          title: "Note saved successfully",
          description: "Your note has been saved and can be viewed in My Notes.",
        })

        setSaveDialogOpen(false)
        setNoteText("")
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
      console.log("Received context:", context.substring(0, 50) + "...")

      // Check if we got a valid context
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
        `We couldn't retrieve additional context for "${article.title}" at this time. This might be due to temporary service limitations. You can still research this topic through other reliable news sources.`,
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
          className="absolute top-3 right-3 bg-red-500/90 text-white rounded-full p-1.5 backdrop-blur-sm"
          title={`Low credibility (${Math.round(article.credibilityScore)}%)`}
        >
          <AlertTriangle className="h-3 w-3" />
        </div>
      )
    } else if (article.credibilityScore >= 70) {
      return (
        <div
          className="absolute top-3 right-3 bg-green-500/90 text-white rounded-full p-1.5 backdrop-blur-sm"
          title={`High credibility (${Math.round(article.credibilityScore)}%)`}
        >
          <CheckCircle className="h-3 w-3" />
        </div>
      )
    } else {
      return (
        <div
          className="absolute top-3 right-3 bg-yellow-500/90 text-white rounded-full p-1.5 backdrop-blur-sm"
          title={`Mixed credibility (${Math.round(article.credibilityScore)}%)`}
        >
          <HelpCircle className="h-3 w-3" />
        </div>
      )
    }

    return null
  }

  const { isFactChecked: factChecked, credibilityScore } = article

  const getCredibilityBadge = () => {
    if (!factChecked) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 text-xs">
          <HelpCircle className="h-3 w-3" />
          Not Verified
        </Badge>
      )
    }

    if (credibilityScore < 30) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1 text-xs">
          <AlertTriangle className="h-3 w-3" />
          Low Credibility ({Math.round(credibilityScore)}%)
        </Badge>
      )
    } else if (credibilityScore < 70) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 text-xs">
          <HelpCircle className="h-3 w-3" />
          Mixed Credibility ({Math.round(credibilityScore)}%)
        </Badge>
      )
    } else {
      return (
        <Badge variant="default" className="flex items-center gap-1 text-xs bg-green-600">
          <CheckCircle className="h-3 w-3" />
          High Credibility ({Math.round(credibilityScore)}%)
        </Badge>
      )
    }
  }

  return (
    <>
      <Card className="overflow-hidden flex flex-col h-full bg-slate-900 border-slate-800 text-white">
        <Link href={dynamicArticleUrl} className="group">
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt={article.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
            {getCredibilityIndicator()}
          </div>
        </Link>

        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between gap-2 mb-2">
            <Badge variant="outline" className="text-xs text-slate-300 border-slate-600">
              {article.source.name}
            </Badge>
            <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(article.publishedAt))} ago</span>
          </div>
          <CardTitle className="line-clamp-2 text-lg text-white leading-tight">
            <Link href={dynamicArticleUrl} className="hover:text-slate-200 transition-colors">
              {article.title}
            </Link>
          </CardTitle>
          <CardDescription className="line-clamp-2 text-slate-300 text-sm">{article.description}</CardDescription>

          {/* Show credibility badge if fact-checked */}
          {article.isFactChecked && <div className="mt-2">{getCredibilityBadge()}</div>}
        </CardHeader>

        <CardContent className="p-4 pt-0 flex-grow">
          <p className="text-sm text-slate-400 line-clamp-3">{article.content}</p>

          {/* Show fact check result summary if available */}
          {article.isFactChecked && article.factCheckResult && (
            <div className="mt-3 p-2 bg-slate-800/50 rounded-md border border-slate-700">
              <p className="text-xs text-slate-300 line-clamp-2">{article.factCheckResult}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <div className="flex items-center justify-between w-full">
            {/* Read Original Button */}
            <Button
              variant="outline"
              size="sm"
              className="bg-transparent border-slate-600 text-white hover:bg-slate-800 hover:text-white px-4 py-2 text-sm font-medium"
              asChild
            >
              {article.url && article.url !== "#" ? (
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  Read Original
                </a>
              ) : (
                <Link href={dynamicArticleUrl}>Read Original</Link>
              )}
            </Button>

            {/* Action Icons Row */}
            <div className="flex items-center gap-2">
              {/* Chat/Comment Icon */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-600"
                title="Ask AI about this article"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setChatDialogOpen(true)
                }}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="sr-only">Ask AI</span>
              </Button>

              {/* Info Icon */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-600"
                title="Get background context"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setContextDialogOpen(true)
                  if (!newsContext) {
                    handleGetContext()
                  }
                }}
              >
                <Info className="h-4 w-4" />
                <span className="sr-only">Get context</span>
              </Button>

              {/* Bookmark/Save Icon */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-600"
                title="Save to My Notes"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setSaveDialogOpen(true)
                }}
              >
                <BookmarkPlus className="h-4 w-4" />
                <span className="sr-only">Save to Notes</span>
              </Button>

              {/* Fact Check/Shield Icon */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-600"
                onClick={handleFactCheck}
                disabled={isFactChecking}
                title={article.isFactChecked ? "View fact check results" : "Run fact check analysis"}
              >
                {isFactChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                <span className="sr-only">Fact check</span>
              </Button>

              {/* External Link/Share Icon */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-600"
                title="Open original article in new tab"
                asChild
              >
                {article.url && article.url !== "#" ? (
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">Open original</span>
                  </a>
                ) : (
                  <Link href={dynamicArticleUrl}>
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View article</span>
                  </Link>
                )}
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Fact Check Results Dialog */}
      <Dialog open={factCheckDialogOpen} onOpenChange={setFactCheckDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Fact Check Analysis</DialogTitle>
            <DialogDescription className="text-slate-300">Detailed analysis of "{article.title}"</DialogDescription>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs text-slate-300 border-slate-600">
                🌍 Checking from the World of news
              </Badge>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Credibility Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-white">Credibility Score</span>
                <span className="font-bold text-lg text-white">
                  {article.credibilityScore ? Math.round(article.credibilityScore) : "N/A"}%
                </span>
              </div>
              {article.credibilityScore && (
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      article.credibilityScore >= 70
                        ? "bg-green-500"
                        : article.credibilityScore >= 30
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${article.credibilityScore}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Summary */}
            {article.factCheckResult && (
              <div className="space-y-2">
                <span className="font-medium text-white">Summary</span>
                <p className="text-sm text-slate-300">{article.factCheckResult}</p>
              </div>
            )}

            {/* Analysis Factors */}
            {article.analysisFactors && article.analysisFactors.length > 0 && (
              <div className="space-y-2">
                <span className="font-medium text-white">Analysis Factors</span>
                <div className="space-y-1">
                  {article.analysisFactors.map((factor, index) => (
                    <div key={index} className="text-sm p-2 bg-slate-800/50 rounded border border-slate-700">
                      {factor}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Claims Analyzed */}
            {article.claimsAnalyzed && article.claimsAnalyzed.length > 0 && (
              <div className="space-y-2">
                <span className="font-medium text-white">Claims Analyzed</span>
                <div className="space-y-2">
                  {article.claimsAnalyzed.map((claim, index) => (
                    <div key={index} className="p-3 border border-slate-700 rounded-md bg-slate-800/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-white">{claim.claim}</span>
                        <Badge
                          variant={
                            claim.verdict === "true"
                              ? "default"
                              : claim.verdict === "false"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {claim.verdict}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-300">{claim.explanation}</p>
                      {claim.sources && claim.sources.length > 0 && (
                        <div className="mt-2">
                          {claim.sources.map((source, sourceIndex) => (
                            <a
                              key={sourceIndex}
                              href={source}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-400 hover:underline mr-2"
                            >
                              Source {sourceIndex + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setFactCheckDialogOpen(false)} className="bg-slate-700 hover:bg-slate-600">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Save Article with Note</DialogTitle>
            <DialogDescription className="text-slate-300">
              Add a note to save with this article. You can view and edit your notes later.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveNote}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="note" className="text-white">
                  Your Note
                </Label>
                <Textarea
                  id="note"
                  placeholder="Add your thoughts about this article..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="min-h-[100px] bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSaveDialogOpen(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-slate-700 hover:bg-slate-600">
                {isSaving ? "Saving..." : "Save Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={contextDialogOpen} onOpenChange={setContextDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">News Context</DialogTitle>
            <DialogDescription className="text-slate-300">
              Additional background information about this news story
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {isLoadingContext ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                <span className="text-slate-300">Getting context...</span>
              </div>
            ) : newsContext ? (
              <div className="prose prose-sm prose-invert max-w-none">
                {newsContext.split("\n").map((paragraph, i) => (
                  <p key={i} className="text-slate-300">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-400 py-4">No additional context available for this article.</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setContextDialogOpen(false)} className="bg-slate-700 hover:bg-slate-600">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Ask AI about this article</DialogTitle>
            <DialogDescription className="text-slate-300">Ask questions about "{article.title}"</DialogDescription>
          </DialogHeader>
          <div className="flex-grow overflow-hidden">
            <NewsAIChat article={article} />
          </div>
          <DialogFooter className="mt-2">
            <Button onClick={() => setChatDialogOpen(false)} className="bg-slate-700 hover:bg-slate-600">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Export both default and named export for compatibility
export default NewsCard

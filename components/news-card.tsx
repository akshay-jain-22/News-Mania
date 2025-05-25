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
      console.log("Starting fact check for article:", article.title)
      const result = await factCheckArticle(article.id)

      console.log("Fact check result:", result)

      // Update the article with fact check results
      setArticle({
        ...article,
        isFactChecked: result.isFactChecked,
        credibilityScore: result.credibilityScore,
        factCheckResult: result.factCheckResult,
        claimsAnalyzed: result.claimsAnalyzed,
      })

      // Show detailed results in dialog
      setFactCheckDialogOpen(true)

      toast({
        title: "Fact check complete",
        description: `Credibility score: ${result.credibilityScore}%. Click to view detailed analysis.`,
      })
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
      // In a real app, this would call an API to save the note
      await new Promise((resolve) => setTimeout(resolve, 800))

      toast({
        title: "Note saved",
        description: "Your note has been saved successfully.",
      })

      setSaveDialogOpen(false)
      setNoteText("")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "There was an error saving your note.",
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

    return null
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
        <Link href={dynamicArticleUrl} className="group">
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

          {/* Show credibility badge if fact-checked */}
          {article.isFactChecked && <div className="mt-2">{getCredibilityBadge()}</div>}
        </CardHeader>

        <CardContent className="p-4 pt-0 flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3">{article.content}</p>

          {/* Show fact check result summary if available */}
          {article.isFactChecked && article.factCheckResult && (
            <div className="mt-3 p-2 bg-muted/50 rounded-md border">
              <p className="text-xs text-muted-foreground line-clamp-2">{article.factCheckResult}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <div className="flex items-center justify-between gap-2 w-full">
            <Button variant="outline" size="sm" asChild>
              {article.url && article.url !== "#" ? (
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  Read Original
                </a>
              ) : (
                <Link href={dynamicArticleUrl}>Read More</Link>
              )}
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
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
                }}
              >
                <Info className="h-4 w-4" />
                <span className="sr-only">Get context</span>
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
                    ? "View fact check details"
                    : "Run AI-powered fact check analysis on this article"
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

      {/* Fact Check Results Dialog */}
      <Dialog open={factCheckDialogOpen} onOpenChange={setFactCheckDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Fact Check Analysis</DialogTitle>
            <DialogDescription>Detailed analysis of "{article.title}"</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Credibility Score */}
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

            {/* Summary */}
            {article.factCheckResult && (
              <div className="space-y-2">
                <span className="font-medium">Summary</span>
                <p className="text-sm text-muted-foreground">{article.factCheckResult}</p>
              </div>
            )}

            {/* Claims Analyzed */}
            {article.claimsAnalyzed && article.claimsAnalyzed.length > 0 && (
              <div className="space-y-2">
                <span className="font-medium">Claims Analyzed</span>
                <div className="space-y-2">
                  {article.claimsAnalyzed.map((claim, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{claim.claim}</span>
                        <Badge
                          variant={
                            claim.verdict === "true"
                              ? "default"
                              : claim.verdict === "false"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {claim.verdict}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{claim.explanation}</p>
                      {claim.sources && claim.sources.length > 0 && (
                        <div className="mt-2">
                          {claim.sources.map((source, sourceIndex) => (
                            <a
                              key={sourceIndex}
                              href={source}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline mr-2"
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

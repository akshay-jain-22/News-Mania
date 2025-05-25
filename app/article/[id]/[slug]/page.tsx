"use client"

import { useEffect, useState } from "react"
import { NewsHeader } from "@/components/news-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { fetchArticleById, factCheckArticle } from "@/lib/news-api"
import { formatDistanceToNow } from "@/lib/utils"
import { BookmarkPlus, ChevronLeft, Share2, ThumbsUp, Loader2, Shield, MessageCircle, Info } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { NotesSection } from "@/components/notes-section"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { NewsAIChat } from "@/components/news-ai-chat"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getNewsContext } from "@/lib/ai-context"
import { ArticleMetadataDisplay } from "@/components/article-metadata-display"

import { InfoIcon } from "lucide-react"

export default function ArticlePage({ params }: { params: { id: string; slug: string } }) {
  const { id } = params
  const [article, setArticle] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFactChecking, setIsFactChecking] = useState(false)
  const [showAIChat, setShowAIChat] = useState(false)
  const [showContext, setShowContext] = useState(false)
  const [isLoadingContext, setIsLoadingContext] = useState(false)
  const [newsContext, setNewsContext] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const getArticle = async () => {
      try {
        console.log("Fetching article with ID:", id)
        setLoading(true)
        setError(null)

        const fetchedArticle = await fetchArticleById(id)

        if (fetchedArticle) {
          console.log("Article fetched successfully:", fetchedArticle.title)
          setArticle(fetchedArticle)
        } else {
          console.error("Article not found")
          setError("Article not found")
        }
      } catch (err) {
        console.error("Error fetching article:", err)
        setError("Failed to load article")
      } finally {
        setLoading(false)
      }
    }

    getArticle()
  }, [id])

  const handleFactCheck = async () => {
    if (!article || article.isFactChecked) return

    setIsFactChecking(true)

    try {
      const result = await factCheckArticle(article.id)

      // Update the article with fact check results
      setArticle({
        ...article,
        isFactChecked: result.isFactChecked,
        credibilityScore: result.credibilityScore,
        factCheckResult: result.factCheckResult,
      })

      toast({
        title: "Fact check complete",
        description: "The article has been analyzed for credibility.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fact check failed",
        description: "There was an error analyzing this article.",
      })
    } finally {
      setIsFactChecking(false)
    }
  }

  const handleGetContext = async () => {
    if (!article) return

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

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <NewsHeader />
        <main className="flex-1 py-6">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center h-[50vh]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading article...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="flex min-h-screen flex-col">
        <NewsHeader />
        <main className="flex-1 py-6">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <h1 className="text-3xl font-bold tracking-tight">Article Not Found</h1>
              <p className="text-muted-foreground mt-2">
                The article you're looking for doesn't exist or has been removed.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/dashboard">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NewsHeader />

      <main className="flex-1 py-6">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to News
                  </Link>
                </Button>
              </div>

              <article className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge>{article.source.name}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(article.publishedAt))} ago
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{article.title}</h1>
                  {article.author && <p className="text-muted-foreground">By {article.author}</p>}
                </div>

                {article.urlToImage && (
                  <div className="relative aspect-video overflow-hidden rounded-lg">
                    <Image
                      src={article.urlToImage || "/placeholder.svg"}
                      alt={article.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {article.isFactChecked && article.credibilityScore !== undefined && (
                  <div className="rounded-md border p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg">Fact Check Analysis</h3>
                      <Badge
                        variant={
                          article.credibilityScore >= 70
                            ? "default"
                            : article.credibilityScore >= 30
                              ? "secondary"
                              : "destructive"
                        }
                        className="text-sm px-3 py-1"
                      >
                        {article.credibilityScore >= 70
                          ? "High Credibility"
                          : article.credibilityScore >= 30
                            ? "Medium Credibility"
                            : "Low Credibility"}{" "}
                        ({Math.round(article.credibilityScore)}%)
                      </Badge>
                    </div>

                    <Progress
                      value={article.credibilityScore}
                      className="h-3"
                      style={{
                        background:
                          article.credibilityScore < 30
                            ? "rgba(239, 68, 68, 0.2)"
                            : article.credibilityScore < 70
                              ? "rgba(234, 179, 8, 0.2)"
                              : "rgba(34, 197, 94, 0.2)",
                      }}
                    />

                    {article.factCheckResult && (
                      <div className="bg-muted/50 p-3 rounded-md border border-muted">
                        <p className="text-sm">{article.factCheckResult}</p>
                      </div>
                    )}

                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground">
                        <InfoIcon className="inline h-4 w-4 mr-1" />
                        This analysis was performed using our AI-powered fact-checking system that evaluates source
                        credibility, content analysis, citation of sources, and balanced reporting.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="outline" size="sm">
                    <BookmarkPlus className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm">
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Like
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowAIChat(!showAIChat)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {showAIChat ? "Hide AI Chat" : "Ask AI"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowContext(!showContext)
                      if (!showContext && !newsContext) {
                        handleGetContext()
                      }
                    }}
                  >
                    <Info className="h-4 w-4 mr-2" />
                    {showContext ? "Hide Context" : "Get Context"}
                  </Button>
                  {!article.isFactChecked && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFactCheck}
                      disabled={isFactChecking}
                      className="bg-muted/50"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {isFactChecking ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        "Run Fact Check Analysis"
                      )}
                    </Button>
                  )}
                  {article.url && article.url !== "#" && (
                    <div className="mt-6">
                      <Button asChild>
                        <a href={article.url} target="_blank" rel="noopener noreferrer">
                          Read Original Article on {article.source.name}
                        </a>
                      </Button>
                    </div>
                  )}
                </div>

                {showAIChat && (
                  <Card className="my-4">
                    <CardHeader>
                      <CardTitle className="text-lg">Ask AI about this article</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <NewsAIChat article={article} />
                    </CardContent>
                  </Card>
                )}

                {showContext && (
                  <Card className="my-4">
                    <CardHeader>
                      <CardTitle className="text-lg">Article Context</CardTitle>
                      <CardDescription>Additional background information about this news story</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingContext ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                          <span>Getting context...</span>
                        </div>
                      ) : newsContext ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {newsContext.split("\n").map((paragraph, i) => (
                            <p key={i} className={i > 0 ? "mt-4" : ""}>
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          No additional context available for this article.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Separator />

                {article.content && (
                  <div className="prose prose-blue dark:prose-invert max-w-none">
                    {article.description && <p className="text-lg leading-relaxed">{article.description}</p>}

                    {/* Render content paragraphs */}
                    {article.content.split("\n\n").map(
                      (paragraph, index) =>
                        paragraph.trim() && (
                          <p key={index} className="leading-relaxed">
                            {paragraph.trim()}
                          </p>
                        ),
                    )}
                  </div>
                )}

                <Separator className="my-6" />

                <NotesSection articleId={id} articleTitle={article.title} />
              </article>
            </div>

            <div className="space-y-6">
              <ArticleMetadataDisplay articleId={id} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

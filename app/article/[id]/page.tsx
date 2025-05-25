"use client"

import { useEffect, useState } from "react"
import { NewsHeader } from "@/components/news-header"
import { Button } from "@/components/ui/button"
import { fetchArticleById, factCheckArticle } from "@/lib/news-api"
import { ChevronLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { getNewsContext } from "@/lib/ai-context"
import { useRouter } from "next/navigation"

// Function to create a URL-friendly slug from the article title
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim()
}

export default function ArticlePage({ params }: { params: { id: string } }) {
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
  const router = useRouter()

  useEffect(() => {
    const getArticle = async () => {
      try {
        console.log("Fetching article with ID:", id)
        const fetchedArticle = await fetchArticleById(id)

        if (fetchedArticle) {
          console.log("Article fetched successfully:", fetchedArticle.title)
          setArticle(fetchedArticle)

          // Create a slug from the title
          const slug = createSlug(fetchedArticle.title)

          // Redirect to the new URL format
          router.replace(`/article/${id}/${slug}`)
        } else {
          console.error("Article not found")
          setError("Article not found")
          setLoading(false)
        }
      } catch (err) {
        console.error("Error fetching article:", err)
        setError("Failed to load article")
        setLoading(false)
      }
    }

    getArticle()
  }, [id, router])

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading article...</p>
        </div>
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

  return null
}

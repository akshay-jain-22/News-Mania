"use client"

import type React from "react"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchNews } from "@/lib/news-api"
import { FactCheckCard } from "@/components/fact-check-card"
import { AlertTriangle, Shield, Link2, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { analyzeArticleCredibility } from "@/lib/rumor-detection"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function FactCheckPage() {
  const [url, setUrl] = useState("")
  const [text, setText] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [factCheckResult, setFactCheckResult] = useState<any>(null)
  const [potentiallyMisleadingNews, setPotentiallyMisleadingNews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Fetch potentially misleading news on component mount
  useState(() => {
    const fetchMisleadingNews = async () => {
      try {
        const news = await fetchNews({
          category: "general",
          pageSize: 6,
        })

        // Sort by credibility score (lowest first)
        const sortedNews = [...news].sort((a, b) => (a.credibilityScore || 0) - (b.credibilityScore || 0))

        setPotentiallyMisleadingNews(sortedNews)
      } catch (error) {
        console.error("Error fetching news:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch news articles. Please try again later.",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchMisleadingNews()
  }, [])

  const handleCheckUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return

    setIsChecking(true)
    setFactCheckResult(null)

    try {
      // Simulate fetching article content from URL
      const mockArticle = {
        title: "Article from " + new URL(url).hostname,
        content:
          "This is the content extracted from the provided URL. In a real implementation, this would be the actual content scraped from the webpage.",
        description: "Article description would be extracted from meta tags or content.",
        source: { name: new URL(url).hostname },
        publishedAt: new Date().toISOString(),
      }

      // Analyze the article for credibility
      const result = await analyzeArticleCredibility(mockArticle)
      setFactCheckResult(result)

      toast({
        title: "Fact check complete",
        description: "The article has been analyzed for credibility.",
      })
    } catch (error) {
      console.error("Error checking URL:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to analyze the URL. Please check the URL and try again.",
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleCheckText = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text) return

    setIsChecking(true)
    setFactCheckResult(null)

    try {
      // Create a mock article from the provided text
      const mockArticle = {
        title: "User Provided Content",
        content: text,
        description: text.substring(0, 150) + "...",
        source: { name: "User Input" },
        publishedAt: new Date().toISOString(),
      }

      // Analyze the article for credibility
      const result = await analyzeArticleCredibility(mockArticle)
      setFactCheckResult(result)

      toast({
        title: "Fact check complete",
        description: "The content has been analyzed for credibility.",
      })
    } catch (error) {
      console.error("Error checking text:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to analyze the text. Please try again.",
      })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />

      <main className="flex-1 py-6">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Fact Check</h1>
              <p className="text-muted-foreground">Verify the credibility of news articles</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Check an Article</CardTitle>
                <CardDescription>Enter a URL or paste content to analyze its credibility</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="url" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url">Check URL</TabsTrigger>
                    <TabsTrigger value="text">Check Text</TabsTrigger>
                  </TabsList>

                  <TabsContent value="url" className="mt-4">
                    <form className="flex flex-col gap-4" onSubmit={handleCheckUrl}>
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="url"
                          placeholder="https://example.com/news-article"
                          className="flex-1"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          required
                        />
                      </div>
                      <Button type="submit" className="w-full sm:w-auto" disabled={isChecking}>
                        {isChecking ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-4 w-4" />
                            Verify Credibility
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="text" className="mt-4">
                    <form className="flex flex-col gap-4" onSubmit={handleCheckText}>
                      <textarea
                        className="min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Paste article text here..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        required
                      ></textarea>
                      <Button type="submit" className="w-full sm:w-auto" disabled={isChecking}>
                        {isChecking ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Shield className="mr-2 h-4 w-4" />
                            Analyze Content
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {factCheckResult && (
                  <div className="mt-6 space-y-4">
                    <Alert
                      className={
                        factCheckResult.credibilityScore >= 70
                          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                          : factCheckResult.credibilityScore >= 30
                            ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800"
                            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                      }
                    >
                      <AlertTitle className="flex items-center gap-2">
                        {factCheckResult.credibilityScore >= 70 ? (
                          <>
                            <Shield className="h-4 w-4 text-green-500" />
                            <span className="text-green-700 dark:text-green-400">High Credibility</span>
                          </>
                        ) : factCheckResult.credibilityScore >= 30 ? (
                          <>
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <span className="text-yellow-700 dark:text-yellow-400">Medium Credibility</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span className="text-red-700 dark:text-red-400">Low Credibility</span>
                          </>
                        )}
                      </AlertTitle>
                      <AlertDescription>{factCheckResult.factCheckResult}</AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Credibility Score</span>
                        <span className="text-sm font-medium">{Math.round(factCheckResult.credibilityScore)}%</span>
                      </div>
                      <Progress
                        value={factCheckResult.credibilityScore}
                        className="h-2"
                        style={{
                          background:
                            factCheckResult.credibilityScore < 30
                              ? "rgba(239, 68, 68, 0.2)"
                              : factCheckResult.credibilityScore < 70
                                ? "rgba(234, 179, 8, 0.2)"
                                : "rgba(34, 197, 94, 0.2)",
                        }}
                      />
                    </div>

                    {factCheckResult.claimsAnalyzed && factCheckResult.claimsAnalyzed.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-lg font-medium mb-2">Claims Analysis</h3>
                        <div className="space-y-3">
                          {factCheckResult.claimsAnalyzed.map((claim: any, index: number) => (
                            <div key={index} className="rounded-md border p-3">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">{claim.claim}</span>
                                <span
                                  className={
                                    claim.verdict === "true"
                                      ? "text-green-600 dark:text-green-400"
                                      : claim.verdict === "false"
                                        ? "text-red-600 dark:text-red-400"
                                        : claim.verdict === "partially true"
                                          ? "text-yellow-600 dark:text-yellow-400"
                                          : "text-gray-600 dark:text-gray-400"
                                  }
                                >
                                  {claim.verdict === "true"
                                    ? "True"
                                    : claim.verdict === "false"
                                      ? "False"
                                      : claim.verdict === "partially true"
                                        ? "Partially True"
                                        : "Unverified"}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{claim.explanation}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <h2 className="text-xl font-bold">Potentially Misleading Articles</h2>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : potentiallyMisleadingNews.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {potentiallyMisleadingNews.map((article) => (
                    <FactCheckCard key={article.id} article={article} />
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTitle>No misleading articles found</AlertTitle>
                  <AlertDescription>
                    We couldn't find any potentially misleading articles at the moment.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

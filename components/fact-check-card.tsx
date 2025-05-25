"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, HelpCircle, ExternalLink, Shield } from "lucide-react"
import { formatDistanceToNow } from "@/lib/utils"
import type { NewsArticle } from "@/types/news"
import { factCheckArticle } from "@/lib/news-api"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import Link from "next/link"

interface FactCheckCardProps {
  article: NewsArticle
}

export function FactCheckCard({ article }: FactCheckCardProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [factChecked, setFactChecked] = useState(article.isFactChecked)
  const [credibilityScore, setCredibilityScore] = useState(article.credibilityScore || 0)
  const [factCheckResult, setFactCheckResult] = useState(article.factCheckResult)
  const { toast } = useToast()

  const handleFactCheck = async () => {
    setIsChecking(true)

    try {
      const result = await factCheckArticle(article.id)

      setFactChecked(result.isFactChecked)
      setCredibilityScore(result.credibilityScore)
      setFactCheckResult(result.factCheckResult)

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
      setIsChecking(false)
    }
  }

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
          Low Credibility
        </Badge>
      )
    } else if (credibilityScore < 70) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <HelpCircle className="h-3 w-3" />
          Mixed Credibility
        </Badge>
      )
    } else {
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <CheckCircle className="h-3 w-3" />
          High Credibility
        </Badge>
      )
    }
  }

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      {article.urlToImage ? (
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={article.urlToImage || "/placeholder.svg"}
            alt={article.title}
            fill
            className="object-cover transition-transform hover:scale-105"
          />
          {factChecked && <div className="absolute top-2 right-2">{getCredibilityBadge()}</div>}
        </div>
      ) : (
        <div className="relative aspect-video w-full overflow-hidden bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">No image available</span>
          {factChecked && <div className="absolute top-2 right-2">{getCredibilityBadge()}</div>}
        </div>
      )}

      <CardHeader className="p-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline">{article.source.name}</Badge>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(article.publishedAt))} ago
          </span>
        </div>
        <CardTitle className="line-clamp-2 text-lg">
          <Link href={`/article/${article.id}`} className="hover:underline">
            {article.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2">{article.description}</CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-0 flex-grow">
        {factChecked && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Credibility Score</span>
              <span className="text-sm font-medium">{Math.round(credibilityScore)}%</span>
            </div>
            <Progress
              value={credibilityScore}
              className="h-2"
              style={
                {
                  background:
                    credibilityScore < 30
                      ? "rgba(239, 68, 68, 0.2)"
                      : credibilityScore < 70
                        ? "rgba(234, 179, 8, 0.2)"
                        : "rgba(34, 197, 94, 0.2)",
                  "--progress-color":
                    credibilityScore < 30
                      ? "rgb(239, 68, 68)"
                      : credibilityScore < 70
                        ? "rgb(234, 179, 8)"
                        : "rgb(34, 197, 94)",
                } as React.CSSProperties
              }
            />
            {factCheckResult && <p className="text-sm text-muted-foreground mt-2">{factCheckResult}</p>}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <div className="flex items-center justify-between gap-2 w-full">
          {!factChecked ? (
            <Button variant="outline" className="w-full" onClick={handleFactCheck} disabled={isChecking}>
              <Shield className="mr-2 h-4 w-4" />
              {isChecking ? "Checking..." : "Fact Check"}
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/article/${article.id}`}>Read More</Link>
            </Button>
          )}
          <Button variant="ghost" size="icon" asChild>
            <a href={article.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Open original</span>
            </a>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

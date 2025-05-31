"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ExternalLink,
  Shield,
  AlertTriangle,
  CheckCircle,
  Info,
  HelpCircle,
  Loader2,
  Clock,
  Share2,
} from "lucide-react"
import { formatDistanceToNow } from "@/lib/utils"
import type { NewsArticle } from "@/types/news"
import { fetchNews, factCheckArticle } from "@/lib/news-api"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import Link from "next/link"
import { SaveArticleButton } from "@/components/save-article-button"

const categories = [
  { id: "general", label: "Top", icon: "📰" },
  { id: "business", label: "Business", icon: "💼" },
  { id: "technology", label: "Technology", icon: "💻" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "health", label: "Health", icon: "🏥" },
  { id: "science", label: "Science", icon: "🔬" },
  { id: "entertainment", label: "Entertainment", icon: "🎬" },
  { id: "politics", label: "Politics", icon: "🏛️" },
  { id: "jewelry", label: "Jewelry", icon: "💎" },
]

// Function to get a category-specific placeholder image
function getCategoryPlaceholder(article: NewsArticle): string {
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

  if (possibleCategory in categoryImages) {
    const images = categoryImages[possibleCategory]
    const hash = article.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return images[hash % images.length]
  }

  const defaultImages = categoryImages.general
  return defaultImages[Math.floor(Math.random() * defaultImages.length)]
}

// Create a URL-friendly slug from the article title
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

interface RichNewsCardProps {
  article: NewsArticle
}

function RichNewsCard({ article: initialArticle }: RichNewsCardProps) {
  const [article, setArticle] = useState(initialArticle)
  const [isFactChecking, setIsFactChecking] = useState(false)
  const { toast } = useToast()

  const imageUrl = article.urlToImage || getCategoryPlaceholder(article)
  const slug = createSlug(article.title)
  const dynamicArticleUrl = article.url && article.url !== "#" ? article.url : `/article/${article.id}/${slug}`

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

      const score = result.credibilityScore
      const scoreEmoji = score >= 70 ? "✅" : score >= 40 ? "⚠️" : "❌"

      toast({
        title: `${scoreEmoji} Fact check complete`,
        description: `Credibility score: ${score}%. Analysis by ${result.analyzedBy || "AI"}.`,
        variant: score >= 70 ? "default" : score >= 40 ? "default" : "destructive",
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

  const getCredibilityIndicator = () => {
    if (!article.isFactChecked || article.credibilityScore === undefined) {
      return null
    }

    if (article.credibilityScore < 30) {
      return (
        <div className="absolute top-3 right-3 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-lg">
          <AlertTriangle className="h-4 w-4" />
        </div>
      )
    } else if (article.credibilityScore >= 70) {
      return (
        <div className="absolute top-3 right-3 bg-green-600 text-white rounded-full p-1.5 shadow-lg">
          <CheckCircle className="h-4 w-4" />
        </div>
      )
    } else {
      return (
        <div className="absolute top-3 right-3 bg-yellow-600 text-white rounded-full p-1.5 shadow-lg">
          <HelpCircle className="h-4 w-4" />
        </div>
      )
    }
  }

  return (
    <Card className="overflow-hidden bg-card border-border hover:shadow-lg transition-all duration-300 group">
      {/* Large Image Header */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={article.title}
          fill
          className="object-cover transition-transform group-hover:scale-105 duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {getCredibilityIndicator()}

        {/* Source badge overlay */}
        <div className="absolute top-3 left-3">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
            {article.source.name}
          </Badge>
        </div>

        {/* Time badge overlay */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="outline" className="bg-background/90 backdrop-blur-sm border-background/50">
            <Clock className="h-3 w-3 mr-1" />
            {formatDistanceToNow(new Date(article.publishedAt))} ago
          </Badge>
        </div>
      </div>

      {/* Content */}
      <CardHeader className="pb-3">
        <CardTitle className="line-clamp-2 text-lg leading-tight hover:text-primary transition-colors">
          <Link href={dynamicArticleUrl}>{article.title}</Link>
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm">{article.description}</CardDescription>
      </CardHeader>

      {/* Action Buttons */}
      <CardFooter className="pt-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="default" size="sm" asChild>
            <Link href={dynamicArticleUrl}>
              Read Original
              <ExternalLink className="ml-2 h-3 w-3" />
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleFactCheck}
            disabled={isFactChecking}
            title="Fact check this article"
          >
            {isFactChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8" title="Get more info">
            <Info className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8" title="Share article">
            <Share2 className="h-4 w-4" />
          </Button>

          <SaveArticleButton
            articleId={article.id}
            articleTitle={article.title}
            articleUrl={article.url}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          />
        </div>
      </CardFooter>
    </Card>
  )
}

export default function Dashboard() {
  const [articles, setArticles] = useState<Record<string, NewsArticle[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [activeCategory, setActiveCategory] = useState("general")

  const loadCategoryNews = async (category: string) => {
    if (articles[category] && articles[category].length > 0) {
      return // Already loaded
    }

    setLoading((prev) => ({ ...prev, [category]: true }))

    try {
      const categoryNews = await fetchNews({
        category: category === "general" ? undefined : category,
        pageSize: 12,
      })

      setArticles((prev) => ({
        ...prev,
        [category]: categoryNews,
      }))
    } catch (error) {
      console.error(`Error loading ${category} news:`, error)
    } finally {
      setLoading((prev) => ({ ...prev, [category]: false }))
    }
  }

  useEffect(() => {
    loadCategoryNews("general")
  }, [])

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
    loadCategoryNews(category)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Stay updated with the latest news from around the world</p>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={handleCategoryChange} className="w-full">
          <TabsList className="grid w-full grid-cols-9 mb-8 h-auto p-1">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <span className="text-lg">{category.icon}</span>
                <span className="text-xs font-medium">{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-0">
              {loading[category.id] ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="overflow-hidden">
                      <div className="aspect-[16/10] bg-muted animate-pulse" />
                      <CardHeader>
                        <div className="h-4 bg-muted rounded animate-pulse mb-2" />
                        <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {articles[category.id]?.map((article) => (
                    <RichNewsCard key={article.id} article={article} />
                  ))}
                </div>
              )}

              {!loading[category.id] && (!articles[category.id] || articles[category.id].length === 0) && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No articles found for this category.</p>
                  <Button variant="outline" className="mt-4" onClick={() => loadCategoryNews(category.id)}>
                    Try Again
                  </Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}

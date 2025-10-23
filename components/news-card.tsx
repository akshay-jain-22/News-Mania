"use client"

import type { NewsArticle } from "@/types/news"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "@/lib/utils"

interface NewsCardProps {
  article: NewsArticle
}

export function NewsCard({ article }: NewsCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {article.image && (
        <div className="h-48 overflow-hidden bg-muted">
          <img src={article.image || "/placeholder.svg"} alt={article.title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="line-clamp-2">{article.title}</CardTitle>
            <CardDescription>{article.source}</CardDescription>
          </div>
          {article.category && <Badge variant="secondary">{article.category}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-2">{article.description}</p>
        <p className="text-xs text-muted-foreground">{formatDistanceToNow(article.publishedAt)}</p>
      </CardContent>
    </Card>
  )
}

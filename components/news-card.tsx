"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { NewsArticle } from "@/types/news"

interface NewsCardProps {
  article: NewsArticle
}

export function NewsCard({ article }: NewsCardProps) {
  const date = new Date(article.publishedAt).toLocaleDateString()

  return (
    <Link href={`/article/${article.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
        <div className="aspect-video relative overflow-hidden bg-muted">
          <img
            src={article.image || "/placeholder.svg"}
            alt={article.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        </div>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {article.category}
            </Badge>
            <span className="text-xs text-muted-foreground">{date}</span>
          </div>
          <CardTitle className="line-clamp-2 text-lg">{article.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-2">{article.description}</CardDescription>
          <p className="text-xs text-muted-foreground mt-3">{article.source}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

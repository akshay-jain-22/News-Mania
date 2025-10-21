import Image from "next/image"
import type { NewsArticle } from "@/types/news"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "@/lib/utils"

export function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-40 w-full">
        <Image
          src={article.image || "/placeholder.svg"}
          alt={article.title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-lg">{article.title}</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            {article.category}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">{article.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{article.source}</span>
          <span>{formatDistanceToNow(new Date(article.publishedAt))}</span>
        </div>
      </CardContent>
    </Card>
  )
}

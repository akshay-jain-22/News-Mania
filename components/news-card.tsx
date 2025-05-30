import type React from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Link } from "lucide-react"
import { format } from "date-fns"
import { SaveArticleButton } from "@/components/save-article-button"

interface NewsCardProps {
  article: {
    title: string
    description: string
    url: string
    urlToImage: string
    publishedAt: string
    source: {
      name: string
    }
  }
}

const NewsCard: React.FC<NewsCardProps> = ({ article }) => {
  return (
    <Card className="bg-secondary">
      <CardHeader>
        <CardTitle>{article.title}</CardTitle>
        <CardDescription>
          <Badge className="mr-2" variant="secondary">
            {article.source.name}
          </Badge>
          {format(new Date(article.publishedAt), "PPP")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>{article.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center space-x-2">
          <Button asChild variant="link">
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
              Read More <Link className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
        <SaveArticleButton
          articleId={article.url || article.title}
          articleTitle={article.title}
          articleUrl={article.url}
          className="flex-1"
        />
      </CardFooter>
    </Card>
  )
}

export default NewsCard

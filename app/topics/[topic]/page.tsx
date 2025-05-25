import { NewsHeader } from "@/components/news-header"
import { NewsCard } from "@/components/news-card"
import { fetchNews } from "@/lib/news-api"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default async function TopicPage({ params }: { params: { topic: string } }) {
  const { topic } = params

  // Format topic name for display (capitalize first letter)
  const topicName = topic.charAt(0).toUpperCase() + topic.slice(1)

  // Fetch news for the selected topic
  const articles = await fetchNews({ category: topic, pageSize: 20 })

  return (
    <div className="flex min-h-screen flex-col">
      <NewsHeader />

      <main className="flex-1 py-6">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/topics">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Topics
                </Link>
              </Button>
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">{topicName} News</h1>
              <p className="text-muted-foreground">Latest news and updates about {topicName.toLowerCase()}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article, index) => (
                <NewsCard key={`${topic}-${index}`} article={article} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

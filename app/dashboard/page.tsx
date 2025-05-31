import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchNews } from "@/lib/news-api"
import { NewsCard } from "@/components/news-card"
import { TopicSelector } from "@/components/topic-selector"
import { DashboardHeader } from "@/components/dashboard-header"
import { RefreshButton } from "@/components/refresh-button"
import { NewsSource } from "@/components/news-source"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import { LastRefreshDisplay } from "@/components/last-refresh-display"

// Define all available categories
const categories = [
  { id: "general", name: "Top" },
  { id: "business", name: "Business" },
  { id: "technology", name: "Technology" },
  { id: "sports", name: "Sports" },
  { id: "health", name: "Health" },
  { id: "science", name: "Science" },
  { id: "entertainment", name: "Entertainment" },
  { id: "politics", name: "Politics" },
  { id: "jewelry", name: "Jewelry" },
]

export default async function DashboardPage() {
  // Fetch news for different categories
  const newsPromises = categories.map((category) => fetchNews({ category: category.id, pageSize: 6 }))

  const newsResults = await Promise.all(newsPromises)

  // Create a map of category ID to news articles
  const categoryNews = categories.reduce(
    (acc, category, index) => {
      acc[category.id] = newsResults[index]
      return acc
    },
    {} as Record<string, any[]>,
  )

  // Generate personalized recommendations based on mock user preferences
  // In a real app, this would be based on user's reading history and preferences
  const personalizedNews = [
    ...newsResults[1].slice(0, 2), // Business
    ...newsResults[2].slice(0, 2), // Technology
    ...newsResults[3].slice(0, 2), // Sports
  ].sort(() => Math.random() - 0.5) // Shuffle the array

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />

      <main className="flex-1 py-6">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">News Dashboard</h1>
                <p className="text-muted-foreground">Browse the latest news by topic</p>
              </div>
              <div className="flex items-center gap-2">
                <TopicSelector />
                <RefreshButton />
                <LastRefreshDisplay />
              </div>
            </div>

            {/* Personalized Section */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>Personalized For You</CardTitle>
                </div>
                <CardDescription>News recommendations based on your reading history and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {personalizedNews.map((article, index) => (
                    <NewsCard key={`personalized-${index}`} article={article} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2">
              <NewsSource name="Google News" active />
              <NewsSource name="Reuters" active />
              <NewsSource name="BBC" active />
              <NewsSource name="CNN" />
              <NewsSource name="The Guardian" />
              <NewsSource name="Al Jazeera" />
              <NewsSource name="Associated Press" />
            </div>

            <Separator className="my-2" />

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 w-full h-auto">
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category.id} value={category.id} className="mt-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {categoryNews[category.id]?.map((article, index) => (
                      <NewsCard key={`${category.id}-${index}`} article={article} />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}

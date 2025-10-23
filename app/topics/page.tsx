import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TopicCard } from "@/components/topic-card"
import { Search } from "lucide-react"

// Define all available topics with more options
const topics = [
  { id: "business", name: "Business", description: "Latest business news, markets, and financial updates" },
  { id: "technology", name: "Technology", description: "Tech news, product launches, and digital trends" },
  { id: "sports", name: "Sports", description: "Sports news, results, and athlete updates" },
  { id: "health", name: "Health", description: "Health news, medical research, and wellness tips" },
  { id: "science", name: "Science", description: "Scientific discoveries, research, and innovations" },
  { id: "entertainment", name: "Entertainment", description: "Movies, music, celebrities, and culture news" },
  { id: "politics", name: "Politics", description: "Political news, policy updates, and government affairs" },
  { id: "environment", name: "Environment", description: "Climate change, conservation, and environmental policy" },
  { id: "education", name: "Education", description: "Education news, learning resources, and academic research" },
  { id: "travel", name: "Travel", description: "Travel destinations, tourism industry, and travel tips" },
  { id: "food", name: "Food", description: "Food trends, recipes, and culinary news" },
  { id: "automotive", name: "Automotive", description: "Car news, reviews, and automotive industry updates" },
  { id: "fashion", name: "Fashion", description: "Fashion trends, designer news, and style guides" },
  { id: "jewelry", name: "Jewelry", description: "Jewelry trends, gemstone news, and luxury accessories" },
  { id: "real-estate", name: "Real Estate", description: "Property market trends, housing news, and investment tips" },
  {
    id: "cryptocurrency",
    name: "Cryptocurrency",
    description: "Crypto market updates, blockchain news, and digital currency trends",
  },
  { id: "gaming", name: "Gaming", description: "Video game news, reviews, and industry updates" },
]

export default async function TopicsPage() {
  // Generate random counts for each topic (in a real app, this would come from the API)
  const topicsWithCounts = topics.map((topic) => ({
    ...topic,
    count: Math.floor(Math.random() * 1900) + 100,
  }))

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />

      <main className="flex-1 py-6">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Browse Topics</h1>
                <p className="text-muted-foreground">Explore news by topic or search for specific content</p>
              </div>
              <div className="flex w-full max-w-sm items-center space-x-2">
                <form action="/search" className="flex w-full gap-2">
                  <Input type="text" name="q" placeholder="Search topics..." required />
                  <Button type="submit">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </form>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {topicsWithCounts.map((topic) => (
                <TopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

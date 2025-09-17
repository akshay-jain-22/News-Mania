import { Header } from "@/components/header"
import { NewsCard } from "@/components/news-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { TopicSelector } from "@/components/topic-selector"
import { fetchNews } from "@/lib/news-api" // Import fetchNews directly

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q: string }
}) {
  const query = searchParams.q || ""

  // If no query is provided, show a message
  if (!query) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1 py-6">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6">
              <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold tracking-tight">Search News</h1>
                <p className="text-muted-foreground">Find the latest news articles on any topic</p>
              </div>

              <div className="flex gap-2">
                <Input type="text" name="q" placeholder="Search for news articles..." className="flex-1" required />
                <Button type="submit">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              <div className="text-center text-muted-foreground">
                Enter a search term to find relevant news articles
              </div>

              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Browse by Topic</h2>
                <TopicSelector />
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Use direct function call instead of fetch to avoid network errors
  console.log(`Page: Searching for "${query}"`)

  let articles = []
  let error = null

  try {
    // Use the categories list to check if the query is a category
    const categories = ["business", "technology", "sports", "health", "science", "entertainment", "politics", "general"]
    const lowerQuery = query.toLowerCase()

    if (categories.includes(lowerQuery)) {
      // If the query is a category, fetch by category
      console.log(`Page: Query "${query}" matches a category, fetching by category`)
      articles = await fetchNews({
        category: lowerQuery,
        pageSize: 20,
        forceRefresh: true,
      })
    } else {
      // Otherwise, perform a regular search
      console.log(`Page: Performing regular search for "${query}"`)
      articles = await fetchNews({
        query: query,
        pageSize: 20,
        forceRefresh: true,
      })
    }

    console.log(`Page: Found ${articles.length} results for "${query}"`)
  } catch (err) {
    console.error("Page: Error fetching search results:", err)
    error = err instanceof Error ? err.message : "An error occurred while searching"

    // Fallback to mock data
    try {
      console.log("Page: Using fallback mock data")
      articles = await fetchNews({
        category: "general",
        pageSize: 10,
      })
    } catch (fallbackErr) {
      console.error("Page: Even fallback failed:", fallbackErr)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold tracking-tight">Search Results</h1>
              <p className="text-muted-foreground">Showing results for "{query}"</p>
            </div>

            <div className="flex gap-2">
              <Input
                type="text"
                name="q"
                placeholder="Search for news articles..."
                className="flex-1"
                defaultValue={query}
                required
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            <div className="text-center text-muted-foreground">Enter a search term to find relevant news articles</div>

            <div className="mt-4">
              <h2 className="text-xl font-semibold mb-4">Browse by Topic</h2>
              <TopicSelector />
            </div>

            <Separator className="my-4" />

            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}. Try a different search term or browse by topic instead.</AlertDescription>
              </Alert>
            ) : articles.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article, index) => (
                  <NewsCard key={`search-${index}-${article.id || index}`} article={article} />
                ))}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No results found</AlertTitle>
                <AlertDescription>
                  No articles match your search query. Try different keywords or browse by topic instead.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

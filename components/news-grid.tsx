import type { NewsArticle } from "@/types/news"
import { NewsCard } from "@/components/news-card"

interface NewsGridProps {
  articles: NewsArticle[]
  title?: string
}

export function NewsGrid({ articles, title }: NewsGridProps) {
  return (
    <section className="space-y-6">
      {title && <h2 className="text-3xl font-bold tracking-tight">{title}</h2>}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  )
}

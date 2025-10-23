import { ArrowRight } from "lucide-react"
import Image from "next/image"

interface NewsCardProps {
  id: string
  title: string
  description: string
  image: string
  category: string
  date: string
  source: string
}

export function NewsCard({ id, title, description, image, category, date, source }: NewsCardProps) {
  return (
    <article className="group flex flex-col rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 w-full overflow-hidden bg-muted">
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src =
              'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3Ctext x="50" y="50" fontSize="12" fill="%239ca3af" textAnchor="middle" dy=".3em"%3ENo image%3C/text%3E%3C/svg%3E'
          }}
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
            {category}
          </span>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>

        <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">{title}</h3>

        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{description}</p>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-medium text-muted-foreground">{source}</span>
          <ArrowRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </article>
  )
}

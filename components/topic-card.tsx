import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface TopicCardProps {
  topic: {
    id: string
    name: string
    description: string
    count: number
  }
}

export function TopicCard({ topic }: TopicCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{topic.name}</CardTitle>
          <Badge>{topic.count} articles</Badge>
        </div>
        <CardDescription className="line-clamp-2">{topic.description}</CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-0 mt-auto">
        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link href={`/topics/${topic.id}`}>
            Browse {topic.name}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

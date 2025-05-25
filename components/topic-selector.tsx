"use client"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"

const topics = [
  { id: "business", name: "Business" },
  { id: "technology", name: "Technology" },
  { id: "sports", name: "Sports" },
  { id: "health", name: "Health" },
  { id: "science", name: "Science" },
  { id: "entertainment", name: "Entertainment" },
  { id: "politics", name: "Politics" },
  { id: "environment", name: "Environment" },
  { id: "jewelry", name: "Jewelry" },
]

export function TopicSelector() {
  const router = useRouter()

  const handleSelectTopic = (topicId: string) => {
    router.push(`/topics/${topicId}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          Select Topic
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuLabel>News Topics</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {topics.map((topic) => (
          <DropdownMenuItem key={topic.id} onClick={() => handleSelectTopic(topic.id)}>
            {topic.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

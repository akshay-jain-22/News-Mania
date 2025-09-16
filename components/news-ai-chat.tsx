"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, Bot, User, Sparkles } from "lucide-react"
import type { NewsArticle } from "@/lib/ai-context"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface NewsAIChatProps {
  article: NewsArticle
  isOpen?: boolean
  onClose?: () => void
}

export function NewsAIChat({ article, isOpen = false, onClose }: NewsAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Initialize chat when opened
  useEffect(() => {
    if (isOpen && !isInitialized) {
      initializeChat()
      setIsInitialized(true)
    }
  }, [isOpen, isInitialized])

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const initializeChat = () => {
    const welcomeMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "assistant",
      content: `Hi! I'm here to help you understand this article: "${article.title}". You can ask me questions about the content, request summaries, or discuss the implications. What would you like to know?`,
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Try to get AI response
      const response = await fetch("/api/news-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          article: {
            title: article.title,
            description: article.description,
            content: article.content,
            source: article.source,
          },
          conversationHistory: messages.slice(-5), // Last 5 messages for context
        }),
      })

      let assistantContent = ""

      if (response.ok) {
        const data = await response.json()
        assistantContent = data.response || generateFallbackResponse(userMessage.content, article)
      } else {
        assistantContent = generateFallbackResponse(userMessage.content, article)
      }

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error getting AI response:", error)

      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        role: "assistant",
        content: generateFallbackResponse(input, article),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const generateFallbackResponse = (userInput: string, article: NewsArticle): string => {
    const input = userInput.toLowerCase()
    const title = article.title?.toLowerCase() || ""
    const description = article.description?.toLowerCase() || ""
    const content = article.content?.toLowerCase() || ""
    const source = article.source || "the source"

    // Question type detection
    if (input.includes("summary") || input.includes("summarize") || input.includes("what is this about")) {
      if (article.description && article.description.length > 50) {
        return `Here's a summary: ${article.description}\n\nThis article was published by ${source}. ${article.content ? "The full article provides additional details and context." : "You can read the full article for more information."}`
      }
      return `This article titled "${article.title}" was published by ${source}. ${article.content ? `Based on the content, it discusses ${extractKeyThemes(article.content).join(", ")}.` : "You can read the full article to learn more about the details."}`
    }

    if (input.includes("who") || input.includes("people") || input.includes("person")) {
      const people = extractPeople(title + " " + description + " " + (content || ""))
      if (people.length > 0) {
        return `Based on the article, the key people mentioned include: ${people.join(", ")}. ${source} reported on their involvement in this story.`
      }
      return `The article doesn't clearly mention specific individuals, but ${source} covers the people involved in this story. You can read the full article for more details about the key figures.`
    }

    if (input.includes("when") || input.includes("time") || input.includes("date")) {
      const publishDate = new Date(article.publishedAt).toLocaleDateString()
      return `This article was published on ${publishDate} by ${source}. ${article.content ? "The events described may have occurred recently or be ongoing developments." : "Check the full article for specific timing of the events discussed."}`
    }

    if (input.includes("where") || input.includes("location") || input.includes("place")) {
      const locations = extractLocations(title + " " + description + " " + (content || ""))
      if (locations.length > 0) {
        return `The article mentions these locations: ${locations.join(", ")}. ${source} provides coverage of events in these areas.`
      }
      return `The specific locations aren't clearly mentioned in the available content, but ${source} covers the geographical context in the full article.`
    }

    if (input.includes("why") || input.includes("reason") || input.includes("cause")) {
      return `The article "${article.title}" by ${source} explores the reasons and context behind these developments. ${article.description || "The full article provides detailed analysis of the underlying causes and implications."}`
    }

    if (input.includes("how") || input.includes("process") || input.includes("method")) {
      return `${source} explains the process and methodology in their article "${article.title}". ${article.description || "The full article details how these events unfolded or how the process works."}`
    }

    if (input.includes("opinion") || input.includes("think") || input.includes("analysis")) {
      return `This article by ${source} presents information about "${article.title}". ${article.description || "For analysis and different perspectives, you might want to read the full article and compare with other sources."}`
    }

    if (input.includes("source") || input.includes("credible") || input.includes("reliable")) {
      return `This article comes from ${source}. When evaluating any news source, it's good practice to cross-reference with multiple outlets and check the original sources cited in the article.`
    }

    // Default response with article context
    return `I can help you understand this article: "${article.title}" from ${source}. ${article.description || "This appears to be a current news story."} What specific aspect would you like to know more about? You can ask about the summary, key people involved, timeline, or implications.`
  }

  const extractKeyThemes = (text: string): string[] => {
    const themes: string[] = []
    const lowerText = text.toLowerCase()

    const themeKeywords = {
      "technology and innovation": ["technology", "ai", "artificial intelligence", "innovation", "digital", "software"],
      "politics and government": ["government", "political", "election", "policy", "congress", "senate"],
      "business and economy": ["business", "economy", "market", "financial", "company", "economic"],
      "health and medicine": ["health", "medical", "hospital", "treatment", "healthcare", "medicine"],
      "sports and athletics": ["sports", "game", "team", "player", "championship", "league"],
      "science and research": ["research", "study", "scientific", "discovery", "experiment", "findings"],
    }

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some((keyword) => lowerText.includes(keyword))) {
        themes.push(theme)
      }
    }

    return themes.length > 0 ? themes : ["current events"]
  }

  const extractPeople = (text: string): string[] => {
    // Simple extraction of capitalized words that might be names
    const words = text.split(/\s+/)
    const possibleNames = words.filter(
      (word) =>
        /^[A-Z][a-z]+$/.test(word) &&
        word.length > 2 &&
        !["The", "This", "That", "And", "But", "For", "With"].includes(word),
    )

    // Remove duplicates and limit to first few
    return [...new Set(possibleNames)].slice(0, 3)
  }

  const extractLocations = (text: string): string[] => {
    const commonLocations = [
      "United States",
      "US",
      "USA",
      "America",
      "Washington",
      "New York",
      "California",
      "Texas",
      "Florida",
      "Europe",
      "Asia",
      "Africa",
      "China",
      "Japan",
      "India",
      "Russia",
      "Germany",
      "France",
      "UK",
      "Britain",
      "Canada",
      "Mexico",
      "Brazil",
      "Australia",
      "Middle East",
      "Israel",
      "Iran",
      "Saudi Arabia",
    ]

    const foundLocations = commonLocations.filter((location) => text.toLowerCase().includes(location.toLowerCase()))

    return [...new Set(foundLocations)].slice(0, 3)
  }

  const suggestedQuestions = [
    "Can you summarize this article?",
    "Who are the key people mentioned?",
    "What are the main implications?",
    "When did this happen?",
  ]

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            AI News Assistant
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Article Context */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm line-clamp-2 mb-2">{article.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {article.source}
                    </Badge>
                    <span>•</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          {/* Chat Messages */}
          <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className="flex-shrink-0">
                      {message.role === "user" ? (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <User className="h-4 w-4 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Suggested Questions */}
          {messages.length <= 1 && (
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(question)}
                    className="text-xs"
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about this article..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

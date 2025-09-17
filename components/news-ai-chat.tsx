"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Bot, User } from "lucide-react"
import type { NewsArticle } from "@/types/news"
import { askQuestionAboutArticle } from "@/lib/ai-context"

interface NewsAIChatProps {
  article: NewsArticle
}

interface ChatMessage {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
}

export function NewsAIChat({ article }: NewsAIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "assistant",
      content: `Hi! I can help you understand this article about "${article.title}". What would you like to know?`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await askQuestionAboutArticle(article, input.trim())

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error getting AI response:", error)

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "I'm sorry, I couldn't process your question right now. Please try again later.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="space-y-4">
      {/* Chat Messages */}
      <div className="max-h-64 overflow-y-auto space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-2 ${message.type === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.type === "assistant" && (
              <div className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <Bot className="h-3 w-3 text-white" />
              </div>
            )}

            <Card
              className={`max-w-[80%] ${
                message.type === "user" ? "bg-blue-500 text-white" : "bg-gray-800 border-gray-700"
              }`}
            >
              <CardContent className="p-3">
                <p className="text-sm">{message.content}</p>
                <p className={`text-xs mt-1 ${message.type === "user" ? "text-blue-100" : "text-gray-400"}`}>
                  {formatTime(message.timestamp)}
                </p>
              </CardContent>
            </Card>

            {message.type === "user" && (
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
              <Bot className="h-3 w-3 text-white" />
            </div>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this article..."
          disabled={isLoading}
          className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
        />
        <Button
          type="submit"
          disabled={!input.trim() || isLoading}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Quick Questions */}
      <div className="flex flex-wrap gap-2">
        {["What's the main point?", "Who is involved?", "When did this happen?", "Why is this important?"].map(
          (question) => (
            <Button
              key={question}
              variant="outline"
              size="sm"
              onClick={() => setInput(question)}
              disabled={isLoading}
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {question}
            </Button>
          ),
        )}
      </div>
    </div>
  )
}

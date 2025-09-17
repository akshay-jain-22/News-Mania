"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Loader2, Lightbulb } from "lucide-react"
import type { NewsArticle } from "@/types/news"
import { getArticleContext, askQuestionAboutArticle } from "@/lib/ai-context"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  type: "user" | "ai" | "context"
  content: string
  timestamp: Date
}

interface NewsAIChatProps {
  article: NewsArticle
}

export function NewsAIChat({ article }: NewsAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [hasContext, setHasContext] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Load article context when component mounts
    loadArticleContext()
  }, [article])

  const loadArticleContext = async () => {
    if (hasContext) return

    try {
      setIsLoading(true)
      const context = await getArticleContext(article)

      const contextMessage: Message = {
        id: `context-${Date.now()}`,
        type: "context",
        content: `📰 **Article Analysis**\n\n**Summary:** ${context.summary}\n\n**Key Points:**\n${context.keyPoints.map((point) => `• ${point}`).join("\n")}\n\n**Topics:** ${context.topics.join(", ")}\n\n💡 **Ask me anything about this article!**`,
        timestamp: new Date(),
      }

      setMessages([contextMessage])
      setHasContext(true)
    } catch (error) {
      console.error("Error loading article context:", error)
      toast({
        title: "Context loading failed",
        description: "Using basic article information",
        variant: "destructive",
      })

      // Fallback context message
      const fallbackMessage: Message = {
        id: `fallback-${Date.now()}`,
        type: "context",
        content: `📰 **Article: ${article.title}**\n\nSource: ${article.source?.name || "Unknown"}\n\nI'm ready to answer questions about this article! Ask me anything you'd like to know.`,
        timestamp: new Date(),
      }

      setMessages([fallbackMessage])
      setHasContext(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const answer = await askQuestionAboutArticle(article, input.trim())

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        type: "ai",
        content: answer,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      console.error("Error getting AI response:", error)

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: "ai",
        content:
          "I'm having trouble processing your question right now. Please try asking something else about the article.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])

      toast({
        title: "AI response failed",
        description: "Please try your question again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const suggestedQuestions = [
    "What are the main points?",
    "Is this source reliable?",
    "What's the significance?",
    "Any potential concerns?",
  ]

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  return (
    <Card className="bg-gray-800 border-gray-600">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-5 w-5 text-purple-400" />
          <h4 className="font-semibold text-white">AI Article Assistant</h4>
          <Badge variant="outline" className="text-xs border-purple-500 text-purple-300">
            Beta
          </Badge>
        </div>

        {/* Messages */}
        <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.type === "user" ? "justify-end" : "justify-start"}`}>
              {message.type !== "user" && (
                <div className="flex-shrink-0">
                  {message.type === "context" ? (
                    <Lightbulb className="h-6 w-6 text-yellow-400 mt-1" />
                  ) : (
                    <Bot className="h-6 w-6 text-purple-400 mt-1" />
                  )}
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : message.type === "context"
                      ? "bg-yellow-900/30 border border-yellow-600/30 text-yellow-100"
                      : "bg-gray-700 text-gray-100"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {message.type === "user" && (
                <div className="flex-shrink-0">
                  <User className="h-6 w-6 text-blue-400 mt-1" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Bot className="h-6 w-6 text-purple-400 mt-1" />
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        {messages.length <= 1 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about this article..."
            className="flex-1 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          AI responses are generated and may not always be accurate. Please verify important information.
        </p>
      </CardContent>
    </Card>
  )
}

"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Bot, User, Loader2 } from "lucide-react"
import { askAIAboutArticle } from "@/lib/ai-context"
import type { NewsArticle } from "@/types/news"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface NewsAIChatProps {
  article: NewsArticle
}

export function NewsAIChat({ article }: NewsAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hi! I'm here to help you understand this article: "${article.title}". What would you like to know about it?`,
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestedQuestions = [
    "What is this article about?",
    "Who are the key people mentioned?",
    "What are the main points?",
    "Why is this news important?",
    "What happened and when?",
  ]

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight
      }
    }
  }, [messages])

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await askAIAboutArticle(article.title, article.description || "", article.content || "", text)

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error getting AI response:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm having trouble analyzing this article right now. Could you try asking your question in a different way?",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      // Focus back on input
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-[500px] bg-gray-900 rounded-lg border border-gray-700">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300"
                }`}
              >
                {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`flex-1 max-w-[80%] ${message.role === "user" ? "text-right" : "text-left"}`}>
                <div
                  className={`inline-block p-3 rounded-lg ${
                    message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-100"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">{formatTime(message.timestamp)}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="inline-block p-3 rounded-lg bg-gray-800 text-gray-100">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Suggested Questions */}
      {messages.length === 1 && (
        <div className="px-4 py-2 border-t border-gray-700">
          <p className="text-xs text-gray-400 mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSendMessage(question)}
                className="text-xs bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                disabled={isLoading}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about this article..."
            className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, Bot, User, MessageCircle } from "lucide-react"
import { generateChatResponse, type ChatMessage, type NewsItem } from "@/lib/ai-context"

interface NewsAIChatProps {
  article: NewsItem
  className?: string
}

export function NewsAIChat({ article, className = "" }: NewsAIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await generateChatResponse(input.trim(), article, messages)

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error generating chat response:", error)

      const errorMessage: ChatMessage = {
        role: "assistant",
        content: `I apologize, but I'm having trouble processing your question about "${article.title}". The article discusses ${article.description || "important news topics"}. Could you try rephrasing your question?`,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
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

  const startNewConversation = () => {
    setMessages([])
    setInput("")
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const suggestedQuestions = [
    "What is this article about?",
    "Can you summarize the key points?",
    "What are the main topics discussed?",
    "Who are the key people mentioned?",
  ]

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline" size="sm" className={`gap-2 ${className}`}>
        <MessageCircle className="h-4 w-4" />
        AI Chat
      </Button>
    )
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Assistant
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={startNewConversation} variant="ghost" size="sm" disabled={messages.length === 0}>
              New Chat
            </Button>
            <Button onClick={() => setIsOpen(false)} variant="ghost" size="sm">
              ×
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Ask questions about: {article.title}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <ScrollArea className="h-64 w-full pr-4" ref={scrollAreaRef}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Start a conversation about this article!</p>
                <div className="mt-4 space-y-2">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="text-xs h-auto p-2 text-left justify-start"
                      onClick={() => setInput(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-2 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="flex-shrink-0">
                    {message.role === "user" ? (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <User className="h-3 w-3 text-primary-foreground" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                        <Bot className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2">
                  <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                    <Bot className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span className="text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about this article..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={handleSendMessage} disabled={!input.trim() || isLoading} size="sm">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          AI responses are generated and may not always be accurate.
        </div>
      </CardContent>
    </Card>
  )
}

export default NewsAIChat

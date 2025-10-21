"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Send, Bot, User, AlertCircle } from "lucide-react"
import type { NewsArticle } from "@/types/news"
import { askAIAboutArticle } from "@/lib/ai-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

interface NewsAIChatProps {
  article: NewsArticle
}

interface Message {
  role: "user" | "assistant" | "system"
  content: string
  isLoading?: boolean
  isError?: boolean
}

export function NewsAIChat({ article }: NewsAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hello! I'm your AI assistant. Ask me anything about "${article.title}".`,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")

    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])

    // Add loading message
    setMessages((prev) => [...prev, { role: "assistant", content: "Thinking...", isLoading: true }])

    setIsLoading(true)

    try {
      console.log("Sending question to AI:", userMessage)

      // Get AI response based on article context
      const response = await askAIAboutArticle(
        article.title,
        article.description || "",
        article.content || "",
        userMessage,
      )

      console.log("Received AI response:", response)

      // Remove loading message and add AI response
      setMessages((prev) => {
        const newMessages = prev.filter((msg) => !msg.isLoading)
        return [...newMessages, { role: "assistant", content: response }]
      })
    } catch (error) {
      console.error("Error getting AI response:", error)

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get a response from the AI. Please try again.",
      })

      // Remove loading message and add error message
      setMessages((prev) => {
        const newMessages = prev.filter((msg) => !msg.isLoading)
        return [
          ...newMessages,
          {
            role: "system",
            content:
              "I'm sorry, I encountered an error processing your request. Please try again with a different question.",
            isError: true,
          },
        ]
      })
    } finally {
      setIsLoading(false)

      // Focus the input again after response
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  return (
    <div className="flex flex-col h-[500px] max-h-[calc(80vh-120px)]">
      <ScrollArea className="flex-grow p-4 border rounded-md mb-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.isError ? (
                <Alert variant="destructive" className="max-w-[80%]">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{message.content}</AlertDescription>
                </Alert>
              ) : (
                <div
                  className={`flex items-start gap-2 max-w-[80%] ${
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div className={`p-1 rounded-full ${message.role === "user" ? "bg-primary" : "bg-muted"}`}>
                    {message.role === "user" ? (
                      <User className="h-5 w-5 text-primary-foreground" />
                    ) : message.isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {message.isLoading ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span>{message.content}</span>
                      </div>
                    ) : (
                      message.content.split("\n").map((paragraph, i) => (
                        <p key={i} className={i > 0 ? "mt-2" : ""}>
                          {paragraph}
                        </p>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this article..."
          disabled={isLoading}
          className="flex-grow"
        />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  )
}

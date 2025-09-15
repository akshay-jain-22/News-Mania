"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Send, Loader2, Info, Lightbulb, Tag, Calendar } from "lucide-react"
import {
  askAIAboutArticle,
  getNewsContext,
  type NewsArticle,
  type ContextResponse,
  type ChatResponse,
} from "@/lib/ai-context"

interface NewsAIChatProps {
  article: NewsArticle
  className?: string
}

interface ChatMessage {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: Date
}

export function NewsAIChat({ article, className = "" }: NewsAIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [context, setContext] = useState<ContextResponse | null>(null)
  const [isLoadingContext, setIsLoadingContext] = useState(false)
  const [activeTab, setActiveTab] = useState<"chat" | "context">("chat")

  const handleSendMessage = async () => {
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
      const response: ChatResponse = await askAIAboutArticle(article, input.trim())

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error getting AI response:", error)

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "I'm having trouble processing your question right now. Please try again or rephrase your question.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleGetContext = async () => {
    if (isLoadingContext || context) return

    setIsLoadingContext(true)
    try {
      const contextResponse = await getNewsContext(article)
      setContext(contextResponse)
      setActiveTab("context")
    } catch (error) {
      console.error("Error getting context:", error)
    } finally {
      setIsLoadingContext(false)
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
    <div className={`space-y-4 ${className}`}>
      {/* Tab Navigation */}
      <div className="flex space-x-2">
        <Button
          variant={activeTab === "chat" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("chat")}
          className="flex items-center gap-2"
        >
          <MessageCircle className="h-4 w-4" />
          AI Chat
        </Button>
        <Button
          variant={activeTab === "context" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setActiveTab("context")
            if (!context) handleGetContext()
          }}
          disabled={isLoadingContext}
          className="flex items-center gap-2"
        >
          {isLoadingContext ? <Loader2 className="h-4 w-4 animate-spin" /> : <Info className="h-4 w-4" />}
          News Context
        </Button>
      </div>

      {/* Chat Tab */}
      {activeTab === "chat" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Ask AI About This Article
            </CardTitle>
            <p className="text-sm text-muted-foreground">Get insights and ask questions about "{article.title}"</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Messages */}
            <ScrollArea className="h-64 w-full border rounded-md p-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>
                    Hi! I'm here to help you understand this article: "{article.title}". What would you like to know
                    about it?
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          message.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">{formatTime(message.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question about this article..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!input.trim() || isLoading} size="icon">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            {/* Suggested Questions */}
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Suggested questions:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "What is this article about?",
                    "Why is this news important?",
                    "What are the key points?",
                    "Who are the main people involved?",
                  ].map((question) => (
                    <Button
                      key={question}
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
          </CardContent>
        </Card>
      )}

      {/* Context Tab */}
      {activeTab === "context" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              News Context
            </CardTitle>
            <p className="text-sm text-muted-foreground">Additional background information about this news story</p>
          </CardHeader>
          <CardContent>
            {isLoadingContext ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Generating context...</span>
              </div>
            ) : context ? (
              <div className="space-y-6">
                {/* Article Summary */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Article Summary
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{context.summary}</p>
                </div>

                <Separator />

                {/* Background Context */}
                <div>
                  <h4 className="font-semibold mb-2">Background Context</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{context.backgroundInfo}</p>
                </div>

                <Separator />

                {/* Significance */}
                <div>
                  <h4 className="font-semibold mb-2">Why This Matters</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{context.significance}</p>
                </div>

                <Separator />

                {/* Key Topics */}
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Key Topics
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {context.keyTopics.map((topic, index) => (
                      <Badge key={index} variant="secondary">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Related Events */}
                {context.relatedEvents.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Related Events
                      </h4>
                      <ul className="space-y-1">
                        {context.relatedEvents.map((event, index) => (
                          <li key={index} className="text-sm text-muted-foreground">
                            • {event}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground">
                  Click "News Context" to get background information about this article.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

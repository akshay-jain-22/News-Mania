import { NextResponse } from "next/server"
import { generateChatResponse } from "@/lib/gemini-client"

interface AssistantRequest {
  message: string
  sessionId: string
  anonId?: string
  userId?: string
  contextType?: string
  contextId?: string
  conversationHistory?: Array<{ role: string; content: string }>
}

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const body: AssistantRequest = await request.json()
    const { message, sessionId, conversationHistory = [], contextType, contextId } = body

    if (!message || !message.trim()) {
      return NextResponse.json({
        response: "I didn't catch that. Could you please repeat?",
        intent: "clarification",
      })
    }

    console.log("[v0] Assistant processing:", message)

    // Detect intent
    const intent = detectIntent(message)
    console.log("[v0] Detected intent:", intent)

    // Build context
    let systemContext = `You are a helpful news assistant for Newsurf. Keep responses concise (2-3 sentences for voice) and natural.`
    
    if (contextType === "article" && contextId) {
      systemContext += `\nThe user is currently viewing article: ${contextId}`
    } else if (contextType === "personalized_feed") {
      systemContext += `\nThe user is viewing their personalized news feed.`
    } else if (contextType === "topic" && contextId) {
      systemContext += `\nThe user is browsing the ${contextId} topic.`
    }

    // Build conversation context
    const conversationContext = conversationHistory
      .slice(-4)
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n")

    // Generate response based on intent
    let response: string
    let actionData: any = null

    switch (intent) {
      case "search":
        const query = extractSearchQuery(message)
        response = `I'll help you search for "${query}". Preparing results now...`
        actionData = { action: "search", query }
        break

      case "navigate":
        const target = extractNavigationTarget(message)
        response = getNavigationResponse(target)
        actionData = { action: "navigate", target }
        break

      case "summarize":
        if (contextType === "article") {
          response = "Let me summarize this article for you. Just a moment..."
          actionData = { action: "summarize", articleId: contextId }
        } else {
          response = "Please open a specific article, and I'll summarize it for you."
        }
        break

      case "fact_check":
        response = "I can help verify the credibility of news. Visit the Fact Check page or click the shield icon on any article."
        actionData = { action: "guide", feature: "fact-check" }
        break

      case "greeting":
        response = "Hello! I can help you search news, navigate the site, or answer questions. What would you like to do?"
        break

      case "help":
        response = "I can search for news, navigate to different sections, summarize articles, and answer your questions. Just ask!"
        break

      default:
        // General conversation - use Gemini
        const fullPrompt = `${systemContext}\n\nConversation:\n${conversationContext}\n\nUser: ${message}\n\nAssistant:`
        response = await generateChatResponse(fullPrompt, conversationContext)
        
        // Keep responses concise for voice
        if (response.length > 300) {
          response = response.substring(0, 297) + "..."
        }
        break
    }

    const latency = Date.now() - startTime
    console.log("[v0] Response generated in", latency, "ms")

    return NextResponse.json({
      response,
      intent,
      actionData,
      latency,
      timestamp: Date.now(),
      provider: "gemini",
    })
  } catch (error) {
    console.error("[Assistant] Error:", error)
    return NextResponse.json(
      {
        response: "I apologize, but I'm having trouble right now. Please try again.",
        intent: "error",
      },
      { status: 500 }
    )
  }
}

function detectIntent(message: string): string {
  const lower = message.toLowerCase()

  if (
    lower.includes("search") ||
    lower.includes("find") ||
    lower.includes("look for") ||
    lower.includes("show me")
  ) {
    return "search"
  }

  if (
    lower.includes("go to") ||
    lower.includes("open") ||
    lower.includes("navigate") ||
    lower.includes("take me")
  ) {
    return "navigate"
  }

  if (
    lower.includes("summarize") ||
    lower.includes("summary") ||
    lower.includes("tldr") ||
    lower.includes("brief")
  ) {
    return "summarize"
  }

  if (
    lower.includes("fact check") ||
    lower.includes("verify") ||
    lower.includes("credibility") ||
    lower.includes("true")
  ) {
    return "fact_check"
  }

  if (
    lower.includes("hello") ||
    lower.includes("hi") ||
    lower.includes("hey") ||
    lower === "hi" ||
    lower === "hello"
  ) {
    return "greeting"
  }

  if (lower.includes("help") || lower.includes("what can you")) {
    return "help"
  }

  return "general"
}

function extractSearchQuery(message: string): string {
  return message
    .toLowerCase()
    .replace(/(search for|find|look for|show me|news about)\s*/gi, "")
    .trim()
}

function extractNavigationTarget(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes("fact check")) return "/fact-check"
  if (lower.includes("personalized")) return "/personalized"
  if (lower.includes("dashboard")) return "/dashboard"
  if (lower.includes("topics")) return "/topics"
  if (lower.includes("search")) return "/search"
  if (lower.includes("home")) return "/"

  return "/"
}

function getNavigationResponse(target: string): string {
  const responses: Record<string, string> = {
    "/": "Taking you to the homepage with breaking news.",
    "/personalized": "Opening your personalized news feed.",
    "/fact-check": "Opening the fact-checking page.",
    "/dashboard": "Opening your dashboard.",
    "/topics": "Taking you to browse topics.",
    "/search": "Opening the search page.",
  }

  return responses[target] || "Navigating now..."
}

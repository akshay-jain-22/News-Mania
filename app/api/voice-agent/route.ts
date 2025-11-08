import { NextResponse } from "next/server"
import { generateChatResponse } from "@/lib/gemini-client"

interface ConversationMessage {
  role: "user" | "assistant"
  content: string
  timestamp: number
}

interface VoiceAgentRequest {
  message: string
  conversationHistory?: ConversationMessage[]
  intent?: string
}

export async function POST(request: Request) {
  try {
    const { message, conversationHistory = [], intent }: VoiceAgentRequest = await request.json()

    if (!message || message.trim() === "") {
      return NextResponse.json({
        response: "I didn't catch that. Could you please repeat your question?",
        intent: "clarification",
      })
    }

    console.log("[Voice Agent] Processing:", message)

    // Detect user intent from the message
    const detectedIntent = detectIntent(message)
    console.log("[Voice Agent] Detected intent:", detectedIntent)

    // Build context from conversation history
    const context = buildConversationContext(conversationHistory)

    // Generate response based on intent
    let response: string
    let actionData: any = null

    switch (detectedIntent) {
      case "search":
        response = await handleSearchIntent(message, context)
        actionData = { action: "search", query: extractSearchQuery(message) }
        break

      case "navigate":
        response = await handleNavigationIntent(message)
        actionData = { action: "navigate", target: extractNavigationTarget(message) }
        break

      case "summarize":
        response = "I can summarize articles for you. Please click on any article and use the summarize button."
        actionData = { action: "guide", feature: "summarize" }
        break

      case "fact_check":
        response =
          "To fact-check news, visit the Fact Check page from the navigation menu, or click the shield icon on any article card."
        actionData = { action: "guide", feature: "fact-check" }
        break

      case "greeting":
        response =
          "Hello! I'm your Newsurf voice assistant. I can help you search for news, navigate the site, or answer questions about articles. How can I assist you today?"
        break

      case "help":
        response = `I can help you with:
• Searching for news articles
• Navigating to different sections
• Understanding article summaries
• Finding trending topics
• Managing your reading preferences

What would you like to do?`
        break

      default:
        // General question answering
        response = await generateChatResponse(message, context)
        break
    }

    return NextResponse.json({
      response,
      intent: detectedIntent,
      actionData,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("[Voice Agent] Error:", error)
    return NextResponse.json({
      response: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
      intent: "error",
    })
  }
}

function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase()

  // Search intent
  if (
    lowerMessage.includes("search") ||
    lowerMessage.includes("find") ||
    lowerMessage.includes("look for") ||
    lowerMessage.includes("show me")
  ) {
    return "search"
  }

  // Navigation intent
  if (
    lowerMessage.includes("go to") ||
    lowerMessage.includes("open") ||
    lowerMessage.includes("navigate") ||
    lowerMessage.includes("take me to")
  ) {
    return "navigate"
  }

  // Summarize intent
  if (
    lowerMessage.includes("summarize") ||
    lowerMessage.includes("summary") ||
    lowerMessage.includes("brief") ||
    lowerMessage.includes("tldr")
  ) {
    return "summarize"
  }

  // Fact check intent
  if (
    lowerMessage.includes("fact check") ||
    lowerMessage.includes("verify") ||
    lowerMessage.includes("credibility") ||
    lowerMessage.includes("is this true")
  ) {
    return "fact_check"
  }

  // Greeting
  if (
    lowerMessage.includes("hello") ||
    lowerMessage.includes("hi ") ||
    lowerMessage.includes("hey") ||
    lowerMessage === "hi" ||
    lowerMessage === "hello"
  ) {
    return "greeting"
  }

  // Help
  if (
    lowerMessage.includes("help") ||
    lowerMessage.includes("what can you do") ||
    lowerMessage.includes("capabilities")
  ) {
    return "help"
  }

  return "general"
}

function extractSearchQuery(message: string): string {
  const lowerMessage = message.toLowerCase()

  // Remove common search phrases
  const cleanedMessage = lowerMessage
    .replace(/search for /gi, "")
    .replace(/find /gi, "")
    .replace(/look for /gi, "")
    .replace(/show me /gi, "")
    .replace(/news about /gi, "")
    .trim()

  return cleanedMessage
}

function extractNavigationTarget(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("fact check")) return "/fact-check"
  if (lowerMessage.includes("personalized")) return "/personalized"
  if (lowerMessage.includes("dashboard")) return "/dashboard"
  if (lowerMessage.includes("topics")) return "/topics"
  if (lowerMessage.includes("search")) return "/search"
  if (lowerMessage.includes("home") || lowerMessage.includes("main")) return "/"

  return "/"
}

function buildConversationContext(history: ConversationMessage[]): string {
  if (history.length === 0) return ""

  const recentMessages = history.slice(-4) // Last 4 messages for context
  return recentMessages.map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`).join("\n")
}

async function handleSearchIntent(message: string, context: string): Promise<string> {
  const query = extractSearchQuery(message)

  if (!query || query.length < 2) {
    return "What would you like to search for? Please be more specific."
  }

  return `I'll search for "${query}" in our news database. You can also use the search bar at the top to refine your search by date, category, or source.`
}

async function handleNavigationIntent(message: string): Promise<string> {
  const target = extractNavigationTarget(message)

  const pageDescriptions: Record<string, string> = {
    "/": "Taking you to the homepage with the latest breaking news.",
    "/personalized": "Opening your personalized news feed based on your reading preferences.",
    "/fact-check": "Opening the fact-checking page where you can verify news credibility.",
    "/dashboard": "Opening your dashboard with reading statistics and preferences.",
    "/topics": "Taking you to browse news by topic and category.",
    "/search": "Opening the advanced search page.",
  }

  return pageDescriptions[target] || "I'm not sure which page you want to visit. Can you be more specific?"
}

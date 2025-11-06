import { NextResponse } from "next/server"
import { generateChatResponse } from "@/lib/gemini-client"

// Cache for Q&A to track variations
const qaCache = new Map<string, { responses: string[]; timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export async function POST(request: Request) {
  try {
    const { title, description, content, question, articleId } = await request.json()

    if (!title || !question) {
      return NextResponse.json(
        {
          response: "I need both article information and a question to provide a helpful answer.",
        },
        { status: 400 },
      )
    }

    try {
      console.log("Processing question about article:", title)
      console.log("Question:", question)

      const cacheKey = `${articleId || title}:${question}`
      const cached = qaCache.get(cacheKey)

      // If cached, return a different variation if available
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        const response = cached.responses[Math.floor(Math.random() * cached.responses.length)]
        return NextResponse.json({
          response,
          cached: true,
          articleId,
        })
      }

      const context = `Article: ${title}\n${description || ""}\n${content || ""}`
      const responseText = await generateChatResponse(question, context)

      console.log("Successfully generated response with Gemini")

      const responses = [responseText]
      try {
        const altResponse = await generateChatResponse(question + " (provide an alternative perspective)", context)
        if (altResponse) responses.push(altResponse)
      } catch (error) {
        console.error("Error generating alternative response:", error)
      }

      // Cache responses
      if (articleId) {
        qaCache.set(cacheKey, {
          responses,
          timestamp: Date.now(),
        })
      }

      // Provide a fallback if the response is empty
      if (!responseText || responseText.trim() === "") {
        return NextResponse.json({
          response: `I don't have enough information in the article to answer your question about "${title}" specifically.`,
          articleId,
        })
      }

      return NextResponse.json({
        response: responseText,
        articleId,
        hasAlternatives: responses.length > 1,
      })
    } catch (error) {
      console.error("Gemini generation error:", error)
      return NextResponse.json({
        response: `I'm having trouble analyzing the article "${title}" to answer your question.`,
      })
    }
  } catch (error) {
    console.error("General error in news-chat API route:", error)
    return NextResponse.json({
      response: "We encountered a technical issue while processing your question. Please try again.",
    })
  }
}

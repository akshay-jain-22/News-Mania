import { NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

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

      const prompt = `
        You are a helpful assistant that answers questions about news articles. Provide factual, balanced information without political bias.
        
        Article Title: ${title}
        Article Description: ${description || "Not available"}
        Article Content: ${content || "Not available"}
        
        User Question: ${question}
        
        Instructions:
        1. Answer based specifically on the article content provided
        2. Be concise but informative (2-3 sentences)
        3. If the answer cannot be determined from the article, acknowledge this but provide general context if helpful
        4. Maintain a neutral, journalistic tone
        5. Focus on facts and evidence from the article
      `

      const { text: responseText } = await generateText({
        model: groq("llama3-70b-8192"),
        prompt: prompt,
        temperature: 0.7,
        maxTokens: 500,
      })

      console.log("Successfully generated response")

      const responses = [responseText]
      try {
        const altPrompt = `
          You are a helpful assistant that answers questions about news articles. Provide a different perspective or emphasis than the previous answer, but covering the same facts.
          
          Article Title: ${title}
          Article Content: ${content || "Not available"}
          
          User Question: ${question}
          
          Provide an alternative answer that emphasizes different aspects or provides additional context.
        `

        const { text: altResponse } = await generateText({
          model: groq("llama3-70b-8192"),
          prompt: altPrompt,
          temperature: 0.8,
          maxTokens: 500,
        })

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
          response: `I don't have enough information in the article to answer your question about "${title}" specifically. You might want to try asking a different question or consulting additional sources.`,
          articleId,
        })
      }

      return NextResponse.json({
        response: responseText,
        articleId,
        hasAlternatives: responses.length > 1,
      })
    } catch (error) {
      console.error("AI generation error:", error)

      return NextResponse.json({
        response: `I'm having trouble analyzing the article "${title}" to answer your question. This might be due to temporary service limitations. You might want to try a different question or try again later.`,
      })
    }
  } catch (error) {
    console.error("General error in news-chat API route:", error)
    return NextResponse.json({
      response:
        "We encountered a technical issue while processing your question. This might be due to temporary service limitations. Please try again in a few moments.",
    })
  }
}

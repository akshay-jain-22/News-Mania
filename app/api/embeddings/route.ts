import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { text, type } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Generate embedding using OpenAI
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text.slice(0, 8000), // Limit text length
        model: "text-embedding-3-small",
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to generate embedding")
    }

    const data = await response.json()
    const embedding = data.data[0].embedding

    // Extract keywords using AI
    let keywords: string[] = []
    let sentiment = 0

    try {
      const { text: keywordText } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `Extract 5-10 key topics/keywords from this text and rate sentiment from -1 (negative) to 1 (positive):

Text: ${text.slice(0, 1000)}

Format: 
Keywords: word1, word2, word3
Sentiment: 0.2`,
      })

      const lines = keywordText.split("\n")
      const keywordLine = lines.find((line) => line.startsWith("Keywords:"))
      const sentimentLine = lines.find((line) => line.startsWith("Sentiment:"))

      if (keywordLine) {
        keywords = keywordLine
          .replace("Keywords:", "")
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean)
      }

      if (sentimentLine) {
        sentiment = Number.parseFloat(sentimentLine.replace("Sentiment:", "").trim()) || 0
      }
    } catch (error) {
      console.error("Error extracting keywords/sentiment:", error)
      // Fallback keyword extraction
      keywords = text
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((word: string) => word.length > 3)
        .slice(0, 10)
    }

    return NextResponse.json({
      embedding,
      keywords,
      sentiment,
      success: true,
    })
  } catch (error) {
    console.error("Error generating embedding:", error)
    return NextResponse.json({ error: "Failed to generate embedding" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text, type } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Try to use OpenAI embeddings if API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch("https://api.openai.com/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: text,
            model: "text-embedding-3-small",
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const embedding = data.data[0].embedding

          // Extract keywords (simple implementation)
          const keywords = extractKeywords(text)
          const sentiment = analyzeSentiment(text)

          return NextResponse.json({
            embedding,
            keywords,
            sentiment,
          })
        }
      } catch (error) {
        console.error("OpenAI API error:", error)
      }
    }

    // Fallback to simple embedding
    const embedding = generateSimpleEmbedding(text)
    const keywords = extractKeywords(text)
    const sentiment = analyzeSentiment(text)

    return NextResponse.json({
      embedding,
      keywords,
      sentiment,
    })
  } catch (error) {
    console.error("Embedding generation error:", error)
    return NextResponse.json({ error: "Failed to generate embedding" }, { status: 500 })
  }
}

function extractKeywords(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3)

  const wordCount = new Map<string, number>()
  words.forEach((word) => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1)
  })

  return Array.from(wordCount.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word)
}

function analyzeSentiment(text: string): number {
  // Simple sentiment analysis
  const positiveWords = ["good", "great", "excellent", "amazing", "wonderful", "fantastic", "positive", "success"]
  const negativeWords = ["bad", "terrible", "awful", "horrible", "negative", "failure", "disaster", "crisis"]

  const words = text.toLowerCase().split(/\s+/)
  let score = 0

  words.forEach((word) => {
    if (positiveWords.includes(word)) score += 1
    if (negativeWords.includes(word)) score -= 1
  })

  return Math.max(-1, Math.min(1, score / words.length))
}

function generateSimpleEmbedding(text: string): number[] {
  // Generate a simple embedding based on text characteristics
  const embedding = new Array(384).fill(0)
  const words = text.toLowerCase().split(/\s+/)

  words.forEach((word, index) => {
    const hash = simpleHash(word)
    const position = hash % 384
    embedding[position] += 1 / words.length
  })

  return embedding
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

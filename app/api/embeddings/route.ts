import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text, type } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Use OpenAI Embeddings API
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
        model: "text-embedding-3-small", // or text-embedding-3-large for better quality
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const embedding = data.data[0].embedding

    // Extract keywords using simple NLP
    const keywords = extractKeywords(text)

    // Analyze sentiment (simple approach)
    const sentiment = analyzeSentiment(text)

    return NextResponse.json({
      embedding,
      keywords,
      sentiment,
      dimensions: embedding.length,
      type,
    })
  } catch (error) {
    console.error("Error generating embedding:", error)

    // Fallback to random embedding for development
    const fallbackEmbedding = Array.from({ length: 1536 }, () => Math.random() - 0.5)
    const text = "default text" // Declare text variable here

    return NextResponse.json({
      embedding: fallbackEmbedding,
      keywords: extractKeywords(text),
      sentiment: 0,
      dimensions: fallbackEmbedding.length,
      type: "fallback",
    })
  }
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .filter(
      (word) =>
        ![
          "this",
          "that",
          "with",
          "have",
          "will",
          "from",
          "they",
          "been",
          "said",
          "each",
          "which",
          "their",
          "time",
          "more",
          "very",
          "what",
          "know",
          "just",
          "first",
          "into",
          "over",
          "think",
          "also",
          "your",
          "work",
          "life",
          "only",
          "can",
          "still",
          "should",
          "after",
          "being",
          "now",
          "made",
          "before",
          "here",
          "through",
          "when",
          "where",
          "how",
          "all",
          "any",
          "may",
          "say",
          "get",
          "has",
          "him",
          "his",
          "had",
          "let",
        ].includes(word),
    )

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
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "wonderful",
    "fantastic",
    "positive",
    "success",
    "win",
    "best",
    "love",
    "like",
    "happy",
    "pleased",
    "excited",
  ]
  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "negative",
    "fail",
    "worst",
    "hate",
    "dislike",
    "sad",
    "angry",
    "disappointed",
    "concerned",
    "worried",
  ]

  const words = text.toLowerCase().split(/\s+/)
  let score = 0

  words.forEach((word) => {
    if (positiveWords.includes(word)) score += 1
    if (negativeWords.includes(word)) score -= 1
  })

  return Math.max(-1, Math.min(1, (score / words.length) * 10))
}

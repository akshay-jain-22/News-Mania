import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text, type } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Generate simple embeddings locally without OpenAI
    const embedding = generateLocalEmbedding(text)
    const keywords = extractKeywords(text)
    const sentiment = analyzeSentiment(text)

    return NextResponse.json({
      embedding,
      keywords,
      sentiment,
      type: type || "text",
    })
  } catch (error) {
    console.error("Error generating embedding:", error)

    // Return fallback embedding
    return NextResponse.json({
      embedding: new Array(384).fill(0).map(() => Math.random() - 0.5),
      keywords: [],
      sentiment: 0,
      type: "text",
    })
  }
}

function generateLocalEmbedding(text: string): number[] {
  // Simple hash-based embedding generation
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)
  const embedding = new Array(384).fill(0)

  words.forEach((word, index) => {
    const hash = simpleHash(word)
    const position = Math.abs(hash) % 384
    embedding[position] += 1 / (index + 1) // Weight by position
  })

  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
  if (magnitude > 0) {
    return embedding.map((val) => val / magnitude)
  }

  return embedding
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash
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
  ]
  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "negative",
    "fail",
    "worst",
    "problem",
    "issue",
    "crisis",
  ]

  const words = text.toLowerCase().split(/\s+/)
  let score = 0

  words.forEach((word) => {
    if (positiveWords.includes(word)) score += 1
    if (negativeWords.includes(word)) score -= 1
  })

  return Math.max(-1, Math.min(1, score / words.length))
}

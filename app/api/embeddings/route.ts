import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { text, type } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // For demo purposes, we'll create a simple embedding
    // In production, you'd use OpenAI's embedding API
    const words = text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2)
    const embedding = new Array(384).fill(0).map(() => Math.random() - 0.5)

    // Extract keywords (simple approach)
    const wordCount = new Map<string, number>()
    words.forEach((word) => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })

    const keywords = Array.from(wordCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)

    // Simple sentiment analysis
    const positiveWords = ["good", "great", "excellent", "amazing", "wonderful", "positive", "success"]
    const negativeWords = ["bad", "terrible", "awful", "negative", "failure", "problem", "crisis"]

    const positiveCount = words.filter((word) => positiveWords.includes(word)).length
    const negativeCount = words.filter((word) => negativeWords.includes(word)).length
    const sentiment = (positiveCount - negativeCount) / Math.max(words.length / 10, 1)

    return NextResponse.json({
      embedding,
      keywords,
      sentiment: Math.max(-1, Math.min(1, sentiment)),
    })
  } catch (error) {
    console.error("Error generating embedding:", error)
    return NextResponse.json({ error: "Failed to generate embedding" }, { status: 500 })
  }
}

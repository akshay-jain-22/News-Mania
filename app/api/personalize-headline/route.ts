import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { originalTitle, userCategories, userKeywords, readingLevel } = body

    if (!originalTitle) {
      return NextResponse.json({ error: "Original title is required" }, { status: 400 })
    }

    const prompt = `
You are a news headline personalization expert. Your task is to rewrite news headlines to make them more engaging and relevant to specific users based on their interests.

Original headline: "${originalTitle}"

User's top interests: ${userCategories?.join(", ") || "general news"}
User's keywords of interest: ${userKeywords?.join(", ") || "current events"}
User's reading preference: ${readingLevel || "balanced"} (quick = shorter, detailed = longer)

Instructions:
1. Keep the core news information intact
2. Make it more appealing to someone interested in: ${userCategories?.join(", ") || "general topics"}
3. Use language that resonates with their interests
4. ${readingLevel === "quick" ? "Keep it concise and punchy" : "Make it more detailed and informative"}
5. Maintain journalistic integrity - don't sensationalize or mislead

Return only the personalized headline, nothing else.
`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxTokens: 100,
    })

    return NextResponse.json({
      personalizedHeadline: text.trim(),
    })
  } catch (error) {
    console.error("Error personalizing headline:", error)
    return NextResponse.json({ error: "Failed to personalize headline" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { originalHeadline, userInterests } = await request.json()

    if (!originalHeadline) {
      return NextResponse.json({ error: "Original headline is required" }, { status: 400 })
    }

    // Use AI to personalize the headline
    const { text: personalizedHeadline } = await generateText({
      model: openai("gpt-4o"),
      system: `You are a news headline personalizer. Your job is to slightly adapt news headlines to make them more engaging for users based on their interests, while maintaining journalistic integrity and factual accuracy. 

Rules:
1. Keep the core facts and meaning unchanged
2. Make subtle adjustments to emphasize aspects that align with user interests
3. Maintain professional journalism standards
4. Don't sensationalize or mislead
5. Keep the headline length similar to the original
6. If no meaningful personalization is possible, return the original headline`,
      prompt: `Original headline: "${originalHeadline}"
User interests: ${userInterests?.join(", ") || "general news"}

Personalize this headline to be more engaging for someone interested in ${userInterests?.join(" and ") || "general news"}, while keeping it factually accurate and professional.`,
    })

    return NextResponse.json({
      originalHeadline,
      personalizedHeadline: personalizedHeadline || originalHeadline,
    })
  } catch (error) {
    console.error("Error personalizing headline:", error)
    return NextResponse.json({ error: "Failed to personalize headline" }, { status: 500 })
  }
}

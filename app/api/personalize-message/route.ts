import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { topCategories, recommendationCount, userInterests, timeOfDay } = await request.json()

    const greeting = timeOfDay < 12 ? "Good morning" : timeOfDay < 18 ? "Good afternoon" : "Good evening"

    try {
      const { text: message } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `
          Create a personalized greeting message for a news reader with these preferences:
          
          Time: ${greeting}
          Top categories: ${topCategories?.join(", ") || "general news"}
          Number of recommendations: ${recommendationCount}
          User interests: ${userInterests?.join(", ") || "various topics"}
          
          Create a warm, engaging message that mentions their interests. Keep it under 150 characters.
          Only return the message, nothing else.
        `,
        maxTokens: 50,
      })

      return NextResponse.json({
        message: message || `${greeting}! Here are ${recommendationCount} articles tailored for you.`,
      })
    } catch (aiError) {
      console.error("AI message generation failed:", aiError)
      // Fallback message
      const fallbackMessage =
        topCategories?.length > 0
          ? `${greeting}! Here's the latest on ${topCategories[0]} and other topics you follow:`
          : `${greeting}! Here are today's top stories curated for you:`

      return NextResponse.json({ message: fallbackMessage })
    }
  } catch (error) {
    console.error("Error personalizing message:", error)
    return NextResponse.json({ error: "Failed to personalize message" }, { status: 500 })
  }
}

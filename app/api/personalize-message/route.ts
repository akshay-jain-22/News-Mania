import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { topCategories, recommendationCount, userInterests, timeOfDay } = await request.json()

    const greeting = timeOfDay < 12 ? "Good morning" : timeOfDay < 18 ? "Good afternoon" : "Good evening"

    const { text: message } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Create a personalized, friendly message to introduce a news feed to a user.

Context:
- Time: ${greeting}
- User's top interests: ${topCategories?.join(", ") || "general news"}
- Number of articles: ${recommendationCount}
- Specific interests: ${userInterests?.join(", ") || "various topics"}

Guidelines:
- Be warm and personal but professional
- Reference their interests naturally
- Keep it under 50 words
- Make them excited to read
- Don't be overly enthusiastic

Return only the message, nothing else.`,
    })

    return NextResponse.json({
      message: message.trim(),
      success: true,
    })
  } catch (error) {
    console.error("Error generating personalized message:", error)

    const fallbackMessages = [
      "Good morning! Here are today's top stories curated for you.",
      "Good afternoon! We've found some interesting articles you might enjoy.",
      "Good evening! Your personalized news feed is ready.",
    ]

    return NextResponse.json({
      message: fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)],
      success: true,
    })
  }
}

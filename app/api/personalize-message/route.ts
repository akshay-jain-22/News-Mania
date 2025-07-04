import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { topCategories, recommendationCount, userInterests, timeOfDay } = await request.json()

    const timeGreeting = timeOfDay < 12 ? "Good morning" : timeOfDay < 18 ? "Good afternoon" : "Good evening"

    const prompt = `
You are a friendly news assistant. Create a personalized welcome message for a user's news feed.

Context:
- Time: ${timeGreeting}
- User's top categories: ${topCategories?.join(", ") || "general news"}
- Number of recommendations: ${recommendationCount || 0}
- User interests: ${userInterests?.join(", ") || "various topics"}

Instructions:
1. Create a warm, personalized greeting
2. Reference their interests naturally
3. Build excitement about the curated content
4. Keep it conversational and under 50 words
5. Don't be overly promotional

Examples:
- "Good morning! We've found some fascinating tech stories that align with your interests in AI and startups."
- "Here's your afternoon briefing with the latest on climate change and renewable energy."

Return only the personalized message, nothing else.
`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxTokens: 80,
      temperature: 0.8,
    })

    const message = text.trim()

    return NextResponse.json({
      message: message || `${timeGreeting}! Here are some stories tailored for you:`,
      timeOfDay,
      categories: topCategories,
    })
  } catch (error) {
    console.error("Error generating personalized message:", error)

    const { timeOfDay, topCategories } = await request.json()
    const timeGreeting = timeOfDay < 12 ? "Good morning" : timeOfDay < 18 ? "Good afternoon" : "Good evening"

    const fallbackMessage =
      topCategories?.length > 0
        ? `${timeGreeting}! Here's the latest on ${topCategories[0]} and other topics you follow:`
        : `${timeGreeting}! Here are today's top stories:`

    return NextResponse.json({
      message: fallbackMessage,
      timeOfDay,
      categories: topCategories,
      error: "Fallback used",
    })
  }
}

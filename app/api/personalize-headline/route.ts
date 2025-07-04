import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { originalTitle, userInterests, preferredCategories, readingHistory } = await request.json()

    if (!originalTitle) {
      return NextResponse.json({ error: "Original title is required" }, { status: 400 })
    }

    const prompt = `
You are a news personalization expert. Your task is to create a personalized headline that will appeal to a specific user based on their interests and reading history.

Original headline: "${originalTitle}"

User profile:
- Interests: ${userInterests?.join(", ") || "general news"}
- Preferred categories: ${preferredCategories?.join(", ") || "general"}
- Recent reading history: ${readingHistory?.length || 0} articles

Instructions:
1. Keep the core information and accuracy of the original headline
2. Adjust the tone and emphasis to match the user's interests
3. Make it more engaging for this specific user
4. Keep it concise (under 100 characters)
5. Don't change facts or add false information

Return only the personalized headline, nothing else.
`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxTokens: 100,
      temperature: 0.7,
    })

    const personalizedHeadline = text.trim().replace(/^["']|["']$/g, "") // Remove quotes if present

    return NextResponse.json({
      personalizedHeadline: personalizedHeadline || originalTitle,
      originalTitle,
    })
  } catch (error) {
    console.error("Error personalizing headline:", error)

    // Fallback to original title
    const { originalTitle } = await request.json()
    return NextResponse.json({
      personalizedHeadline: originalTitle,
      originalTitle,
      error: "Fallback used",
    })
  }
}

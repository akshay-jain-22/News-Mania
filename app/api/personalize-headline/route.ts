import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { originalTitle, userInterests, preferredCategories, readingHistory } = await request.json()

    if (!originalTitle) {
      return NextResponse.json({ error: "Original title is required" }, { status: 400 })
    }

    try {
      const { text: personalizedHeadline } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `
          Rewrite this news headline to be more engaging for a user with these interests:
          
          Original headline: "${originalTitle}"
          User interests: ${userInterests?.join(", ") || "general news"}
          Preferred categories: ${preferredCategories?.join(", ") || "general"}
          
          Make it more personalized and engaging while keeping the core information. Keep it under 100 characters.
          Only return the new headline, nothing else.
        `,
        maxTokens: 50,
      })

      return NextResponse.json({
        personalizedHeadline: personalizedHeadline || originalTitle,
      })
    } catch (aiError) {
      console.error("AI headline generation failed:", aiError)
      // Fallback to simple personalization
      const personalizedHeadline = `${originalTitle} - Trending in ${preferredCategories?.[0] || "News"}`
      return NextResponse.json({ personalizedHeadline })
    }
  } catch (error) {
    console.error("Error personalizing headline:", error)
    return NextResponse.json({ error: "Failed to personalize headline" }, { status: 500 })
  }
}

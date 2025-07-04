import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export async function POST(request: NextRequest) {
  try {
    const { originalTitle, userInterests, preferredCategories, readingHistory } = await request.json()

    if (!originalTitle) {
      return NextResponse.json({ error: "Original title is required" }, { status: 400 })
    }

    const { text: personalizedHeadline } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Create a personalized, engaging headline for this news article based on the user's interests.

Original headline: "${originalTitle}"

User interests: ${userInterests?.join(", ") || "general news"}
Preferred categories: ${preferredCategories?.join(", ") || "general"}
Recent reading topics: ${readingHistory?.slice(0, 3).join(", ") || "various topics"}

Guidelines:
- Keep it concise and engaging (under 80 characters)
- Highlight aspects that would interest this specific user
- Maintain factual accuracy
- Make it more compelling than the original
- Don't use clickbait tactics

Return only the personalized headline, nothing else.`,
    })

    return NextResponse.json({
      personalizedHeadline: personalizedHeadline.trim(),
      success: true,
    })
  } catch (error) {
    console.error("Error personalizing headline:", error)
    return NextResponse.json({ personalizedHeadline: request.body?.originalTitle || "News Update" }, { status: 200 })
  }
}

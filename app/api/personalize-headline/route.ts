import { type NextRequest, NextResponse } from "next/server"
import { askGemini } from "@/lib/gemini-client"

export async function POST(request: NextRequest) {
  try {
    const { originalTitle, userInterests, preferredCategories, readingHistory } = await request.json()

    if (!originalTitle) {
      return NextResponse.json({ error: "Original title is required" }, { status: 400 })
    }

    try {
      const prompt = `Personalize this news headline for a user with these interests:
- Categories: ${preferredCategories?.join(", ") || "general"}
- Interests: ${userInterests?.join(", ") || "current events"}

Original headline: "${originalTitle}"

Create a personalized version that would appeal to this user while keeping the core information. Make it engaging and relevant to their interests. Return only the personalized headline, nothing else.`

      const personalizedHeadline = await askGemini(prompt, 0.7, 100)

      return NextResponse.json({ personalizedHeadline: personalizedHeadline.trim() })
    } catch (error) {
      console.error("Gemini API error:", error)

      // Fallback to simple personalization
      const personalizedHeadline = simplePersonalization(originalTitle, preferredCategories, userInterests)
      return NextResponse.json({ personalizedHeadline })
    }
  } catch (error) {
    console.error("Headline personalization error:", error)
    return NextResponse.json({ personalizedHeadline: "Default Title" }) // Updated to handle the case where originalTitle is not available
  }
}

function simplePersonalization(title: string, categories: string[] = [], interests: string[] = []): string {
  // Simple rule-based personalization
  const allInterests = [...categories, ...interests].map((i) => i.toLowerCase())

  if (allInterests.includes("technology") && title.toLowerCase().includes("tech")) {
    return `🚀 ${title}`
  }
  if (allInterests.includes("business") && title.toLowerCase().includes("market")) {
    return `📈 ${title}`
  }
  if (allInterests.includes("sports") && title.toLowerCase().includes("sport")) {
    return `⚽ ${title}`
  }
  if (allInterests.includes("health") && title.toLowerCase().includes("health")) {
    return `🏥 ${title}`
  }

  return title
}

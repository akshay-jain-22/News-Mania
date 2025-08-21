import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { originalTitle, userInterests, preferredCategories, readingHistory } = await request.json()

    if (!originalTitle) {
      return NextResponse.json({ error: "Original title is required" }, { status: 400 })
    }

    // Try to use OpenAI for personalization if API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        const prompt = `
Personalize this news headline for a user with these interests:
- Categories: ${preferredCategories?.join(", ") || "general"}
- Interests: ${userInterests?.join(", ") || "current events"}

Original headline: "${originalTitle}"

Create a personalized version that would appeal to this user while keeping the core information. Make it engaging and relevant to their interests. Return only the personalized headline.
`

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 100,
            temperature: 0.7,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          const personalizedHeadline = data.choices[0].message.content.trim()

          return NextResponse.json({ personalizedHeadline })
        }
      } catch (error) {
        console.error("OpenAI API error:", error)
      }
    }

    // Fallback to simple personalization
    const personalizedHeadline = simplePersonalization(originalTitle, preferredCategories, userInterests)

    return NextResponse.json({ personalizedHeadline })
  } catch (error) {
    console.error("Headline personalization error:", error)
    return NextResponse.json({ personalizedHeadline: "Default Title" }) // Updated to provide a default title
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

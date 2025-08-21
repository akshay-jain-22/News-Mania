import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { topCategories, recommendationCount, userInterests, timeOfDay } = await request.json()

    // Try to use OpenAI for message generation if API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        const prompt = `
Create a personalized greeting message for a news feed user with these characteristics:
- Top interests: ${topCategories?.join(", ") || "general news"}
- Number of recommendations: ${recommendationCount || 0}
- Time of day: ${timeOfDay || 12} (24-hour format)
- Other interests: ${userInterests?.join(", ") || "current events"}

Create a warm, engaging message that acknowledges their interests and the time of day. Keep it concise (1-2 sentences).
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
          const message = data.choices[0].message.content.trim()

          return NextResponse.json({ message })
        }
      } catch (error) {
        console.error("OpenAI API error:", error)
      }
    }

    // Fallback to simple message generation
    const message = generateSimpleMessage(topCategories, recommendationCount, timeOfDay)

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Message generation error:", error)
    return NextResponse.json({ message: "Here are your personalized news recommendations!" })
  }
}

function generateSimpleMessage(categories: string[] = [], count = 0, timeOfDay = 12): string {
  const greetings = {
    morning: ["Good morning", "Rise and shine", "Start your day"],
    afternoon: ["Good afternoon", "Hope your day is going well", "Afternoon update"],
    evening: ["Good evening", "Evening briefing", "End your day informed"],
  }

  let timeGreeting = "Hello"
  if (timeOfDay < 12) {
    const morningGreetings = greetings.morning
    timeGreeting = morningGreetings[Math.floor(Math.random() * morningGreetings.length)]
  } else if (timeOfDay < 18) {
    const afternoonGreetings = greetings.afternoon
    timeGreeting = afternoonGreetings[Math.floor(Math.random() * afternoonGreetings.length)]
  } else {
    const eveningGreetings = greetings.evening
    timeGreeting = eveningGreetings[Math.floor(Math.random() * eveningGreetings.length)]
  }

  if (categories.length > 0) {
    return `${timeGreeting}! Here's the latest on ${categories[0]} and other topics you follow.`
  }

  return `${timeGreeting}! We've curated ${count} articles based on your interests.`
}

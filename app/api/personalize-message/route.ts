import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { topCategories, recommendationCount, userInterests, timeOfDay } = await request.json()

    // Generate personalized message locally without OpenAI
    const message = generatePersonalizedMessageLocally({
      topCategories,
      recommendationCount,
      userInterests,
      timeOfDay,
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Error generating personalized message:", error)
    return NextResponse.json({
      message: "Here are some news articles tailored for you:",
    })
  }
}

function generatePersonalizedMessageLocally({
  topCategories = [],
  recommendationCount = 0,
  userInterests = [],
  timeOfDay = 12,
}: {
  topCategories?: string[]
  recommendationCount?: number
  userInterests?: string[]
  timeOfDay?: number
}) {
  const greeting = timeOfDay < 12 ? "Good morning" : timeOfDay < 18 ? "Good afternoon" : "Good evening"

  if (topCategories.length > 0) {
    const primaryCategory = topCategories[0]
    const messages = [
      `${greeting}! Here's the latest on ${primaryCategory} and other topics you follow:`,
      `${greeting}! We've curated ${recommendationCount} articles about ${primaryCategory} and more:`,
      `${greeting}! Your personalized feed includes fresh ${primaryCategory} news:`,
      `${greeting}! Based on your interest in ${primaryCategory}, here's what's trending:`,
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  if (userInterests.length > 0) {
    return `${greeting}! Here are today's top stories in ${userInterests[0]} and other areas you're interested in:`
  }

  const genericMessages = [
    `${greeting}! Here are today's top stories curated just for you:`,
    `${greeting}! Your personalized news feed is ready:`,
    `${greeting}! We've selected these articles based on your reading habits:`,
  ]

  return genericMessages[Math.floor(Math.random() * genericMessages.length)]
}

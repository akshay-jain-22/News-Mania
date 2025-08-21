import { type NextRequest, NextResponse } from "next/server"

function personalizeHeadlineLocally(headline: string, userInterests: string[] = []): string {
  if (!userInterests || userInterests.length === 0) {
    return headline
  }

  // Simple local personalization without AI
  const lowerHeadline = headline.toLowerCase()
  const primaryInterest = userInterests[0]?.toLowerCase()

  // Add context based on user interests
  if (
    primaryInterest === "technology" &&
    (lowerHeadline.includes("tech") || lowerHeadline.includes("ai") || lowerHeadline.includes("digital"))
  ) {
    return `🚀 ${headline}`
  }

  if (
    primaryInterest === "business" &&
    (lowerHeadline.includes("market") || lowerHeadline.includes("economy") || lowerHeadline.includes("company"))
  ) {
    return `📈 ${headline}`
  }

  if (
    primaryInterest === "science" &&
    (lowerHeadline.includes("research") || lowerHeadline.includes("study") || lowerHeadline.includes("discovery"))
  ) {
    return `🔬 ${headline}`
  }

  if (
    primaryInterest === "health" &&
    (lowerHeadline.includes("health") || lowerHeadline.includes("medical") || lowerHeadline.includes("treatment"))
  ) {
    return `🏥 ${headline}`
  }

  // Return original headline if no personalization applies
  return headline
}

export async function POST(request: NextRequest) {
  try {
    const { originalHeadline, userInterests } = await request.json()

    if (!originalHeadline) {
      return NextResponse.json({ error: "Original headline is required" }, { status: 400 })
    }

    // For now, return the original headline with a simple personalization
    // This avoids OpenAI API calls and quota issues
    const personalizedHeadline = personalizeHeadlineLocally(originalHeadline, userInterests)

    return NextResponse.json({
      originalHeadline,
      personalizedHeadline: personalizedHeadline || originalHeadline,
    })
  } catch (error) {
    console.error("Error personalizing headline:", error)
    // Always return the original headline as fallback
    const { originalHeadline } = await request.json().catch(() => ({ originalHeadline: "News Article" }))
    return NextResponse.json({
      originalHeadline,
      personalizedHeadline: originalHeadline,
    })
  }
}

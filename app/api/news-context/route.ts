import { NextResponse } from "next/server"
import { askGemini } from "@/lib/gemini-client"

export async function POST(request: Request) {
  try {
    const { title, description, content } = await request.json()

    if (!title) {
      return NextResponse.json(
        {
          context: "Unable to generate context without article information. Please provide a valid article.",
        },
        { status: 400 },
      )
    }

    try {
      console.log("Generating context for article:", title)

      const prompt = `You are a helpful assistant that provides background context for news articles.
        
Article Title: ${title}
Article Description: ${description || "Not available"}
Article Content: ${content || "Not available"}

Please provide background context and additional information about this news topic in 3-4 paragraphs.`

      const contextText = await askGemini(prompt, 0.7, 500)

      console.log("Successfully generated context with Gemini")

      if (!contextText || contextText.trim() === "") {
        return NextResponse.json({
          context:
            "This news topic appears to be about " +
            title +
            ". You can research more about this topic through reliable news sources.",
        })
      }

      return NextResponse.json({ context: contextText })
    } catch (error) {
      console.error("Gemini generation error:", error)

      return NextResponse.json({
        context: `This article titled "${title}" may require additional context. You can look for related news from multiple sources.`,
      })
    }
  } catch (error) {
    console.error("General error in news-context API route:", error)
    return NextResponse.json({
      context: "We encountered a technical issue while analyzing this article. Please try again.",
    })
  }
}

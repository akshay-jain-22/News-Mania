import { NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

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

      const prompt = `
        You are a helpful assistant that provides background context for news articles. Provide factual, balanced information without political bias.
        
        Article Title: ${title}
        Article Description: ${description || "Not available"}
        Article Content: ${content || "Not available"}
        
        Please provide background context and additional information about this news topic in 3-4 paragraphs.
      `

      const { text: contextText } = await generateText({
        model: groq("llama3-70b-8192"),
        prompt: prompt,
        temperature: 0.7,
        maxTokens: 500,
      })

      console.log("Successfully generated context")

      // Provide a fallback if the response is empty
      if (!contextText || contextText.trim() === "") {
        return NextResponse.json({
          context:
            "This news topic appears to be about " +
            title +
            ". While specific context couldn't be generated, you can research more about this topic through reliable news sources and fact-checking websites.",
        })
      }

      return NextResponse.json({ context: contextText })
    } catch (error) {
      console.error("AI generation error:", error)

      // Provide a more helpful fallback response
      return NextResponse.json({
        context: `This article titled "${title}" may require additional context. While our AI system couldn't generate specific background information at this moment, you can look for related news from multiple sources to get a more complete picture.`,
      })
    }
  } catch (error) {
    console.error("General error in news-context API route:", error)
    return NextResponse.json({
      context:
        "We encountered a technical issue while analyzing this article. This might be due to temporary service limitations. Please try again in a few moments.",
    })
  }
}

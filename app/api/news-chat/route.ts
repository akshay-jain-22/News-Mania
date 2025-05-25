import { NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: Request) {
  try {
    const { title, description, content, question } = await request.json()

    if (!title || !question) {
      return NextResponse.json(
        {
          response: "I need both article information and a question to provide a helpful answer.",
        },
        { status: 400 },
      )
    }

    try {
      console.log("Processing question about article:", title)
      console.log("Question:", question)

      const prompt = `
        You are a helpful assistant that answers questions about news articles. Provide factual, balanced information without political bias.
        
        Article Title: ${title}
        Article Description: ${description || "Not available"}
        Article Content: ${content || "Not available"}
        
        User Question: ${question}
        
        Please answer the question based on the article content. If the answer cannot be determined from the article, say so clearly but try to provide general information that might be helpful.
      `

      const { text: responseText } = await generateText({
        model: groq("llama3-70b-8192"),
        prompt: prompt,
        temperature: 0.7,
        maxTokens: 500,
      })

      console.log("Successfully generated response")

      // Provide a fallback if the response is empty
      if (!responseText || responseText.trim() === "") {
        return NextResponse.json({
          response: `I don't have enough information in the article to answer your question about "${title}" specifically. You might want to try asking a different question or consulting additional sources.`,
        })
      }

      return NextResponse.json({ response: responseText })
    } catch (error) {
      console.error("AI generation error:", error)

      // Provide a more helpful fallback response
      return NextResponse.json({
        response: `I'm having trouble analyzing the article "${title}" to answer your question. This might be due to temporary service limitations. You might want to try a different question or try again later.`,
      })
    }
  } catch (error) {
    console.error("General error in news-chat API route:", error)
    return NextResponse.json({
      response:
        "We encountered a technical issue while processing your question. This might be due to temporary service limitations. Please try again in a few moments.",
    })
  }
}

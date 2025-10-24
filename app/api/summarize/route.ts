import { NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

// Cache for summaries to ensure consistency but allow variation
const summaryCache = new Map<string, { summary: string; timestamp: number; variations: string[] }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export async function POST(request: Request) {
  try {
    const { articleId, title, description, content, style = "concise" } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        {
          summary: "Unable to summarize without article content. Please provide a valid article.",
        },
        { status: 400 },
      )
    }

    try {
      console.log("Generating summary for article:", articleId || title)

      // Check cache for existing summary
      const cached = summaryCache.get(articleId || title)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        // Return a variation if available, otherwise return cached
        const variation = cached.variations[Math.floor(Math.random() * cached.variations.length)]
        return NextResponse.json({
          summary: variation || cached.summary,
          cached: true,
          articleId,
        })
      }

      // Generate context-aware summary with specific style
      const stylePrompts = {
        concise: "Provide a 2-3 sentence summary focusing on the main facts and key takeaways.",
        detailed: "Provide a 4-5 sentence summary with important details and context.",
        analytical: "Provide a 3-4 sentence analytical summary explaining the significance and implications.",
        headline: "Provide a single compelling headline-style summary (one sentence).",
      }

      const styleInstruction = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.concise

      const prompt = `
        You are an expert news summarizer. Your task is to create a clear, accurate, and engaging summary of a news article.
        
        Article Title: ${title}
        Article Description: ${description || "Not available"}
        Article Content: ${content.substring(0, 2000)}
        
        ${styleInstruction}
        
        Important: Make the summary specific to this article's content and context. Avoid generic summaries.
        Focus on: What happened, who it affects, and why it matters.
      `

      const { text: summaryText } = await generateText({
        model: groq("llama3-70b-8192"),
        prompt: prompt,
        temperature: 0.7,
        maxTokens: 300,
      })

      console.log("Successfully generated summary")

      // Generate 2-3 variations for future requests
      const variations = [summaryText]
      if (articleId) {
        try {
          const variationPrompt = `
            You are an expert news summarizer. Create an alternative summary of the same article with a different perspective or emphasis.
            
            Article Title: ${title}
            Article Content: ${content.substring(0, 2000)}
            
            ${styleInstruction}
            
            Important: This should be a different summary than the previous one, but covering the same key facts.
          `

          const { text: variation1 } = await generateText({
            model: groq("llama3-70b-8192"),
            prompt: variationPrompt,
            temperature: 0.8,
            maxTokens: 300,
          })

          if (variation1) variations.push(variation1)
        } catch (error) {
          console.error("Error generating variation:", error)
        }
      }

      // Cache the summary and variations
      if (articleId) {
        summaryCache.set(articleId, {
          summary: summaryText,
          timestamp: Date.now(),
          variations,
        })
      }

      if (!summaryText || summaryText.trim() === "") {
        return NextResponse.json({
          summary: `This article titled "${title}" covers important news. The main points include information about ${description?.substring(0, 50) || "current events"}. For more details, please read the full article.`,
          articleId,
        })
      }

      return NextResponse.json({
        summary: summaryText,
        articleId,
        style,
        variations: variations.length > 1 ? variations.slice(1) : [],
      })
    } catch (error) {
      console.error("AI generation error:", error)

      return NextResponse.json({
        summary: `This article titled "${title}" discusses ${description?.substring(0, 50) || "current events"}. Please read the full article for complete information.`,
        articleId,
        error: "Failed to generate optimal summary",
      })
    }
  } catch (error) {
    console.error("General error in summarize API route:", error)
    return NextResponse.json(
      {
        summary: "We encountered a technical issue while summarizing this article. Please try again in a few moments.",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const articleId = searchParams.get("articleId")

  if (!articleId) {
    return NextResponse.json({ error: "Article ID is required" }, { status: 400 })
  }

  const cached = summaryCache.get(articleId)
  if (cached) {
    return NextResponse.json({
      summary: cached.summary,
      cached: true,
      variations: cached.variations,
    })
  }

  return NextResponse.json({ error: "No cached summary found" }, { status: 404 })
}

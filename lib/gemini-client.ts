import { google } from "@ai-sdk/google"
import { openai } from "@ai-sdk/openai"
import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function askGemini(prompt: string, temperature = 0.3, maxTokens = 500): Promise<string> {
  // Try Gemini first if key is available
  if (GEMINI_API_KEY) {
    try {
      console.log("[v0] Calling Gemini API...")
      const { text } = await generateText({
        model: google("gemini-1.5-flash"),
        prompt,
        temperature,
        maxTokens,
      })
      console.log("[v0] Gemini response received")
      return text
    } catch (error) {
      console.warn(
        "[v0] Gemini API failed (invalid key or error). Falling back to alternative provider...",
        error instanceof Error ? error.message : error,
      )
      // Continue to fallback providers below
    }
  }

  // Fallback to OpenAI
  if (OPENAI_API_KEY) {
    try {
      if (!GEMINI_API_KEY) {
        console.warn("[v0] GOOGLE_GENERATIVE_AI_API_KEY not set. Using OpenAI as fallback.")
      }
      console.log("[v0] Calling OpenAI API...")
      const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt,
        temperature,
        maxTokens,
      })
      console.log("[v0] OpenAI response received")
      return text
    } catch (error) {
      console.error("[v0] OpenAI API error:", error)
      // Continue to next fallback
    }
  }

  // Fallback to Groq
  if (GROQ_API_KEY) {
    try {
      console.log("[v0] Calling Groq API...")
      const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        prompt,
        temperature,
        maxTokens,
      })
      console.log("[v0] Groq response received")
      return text
    } catch (error) {
      console.error("[v0] Groq API error:", error)
    }
  }

  throw new Error(
    "All AI providers failed. Please check your API keys: GOOGLE_GENERATIVE_AI_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY",
  )
}

export async function summarizeArticle(title: string, content: string, style = "concise"): Promise<string> {
  const stylePrompts = {
    concise: "Provide a 2-3 sentence summary focusing on the main facts and key takeaways.",
    detailed: "Provide a 4-5 sentence summary with important details and context.",
    analytical: "Provide a 3-4 sentence analytical summary explaining the significance and implications.",
    headline: "Provide a single compelling headline-style summary (one sentence).",
  }

  const styleInstruction = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.concise

  const prompt = `You are an expert news summarizer. Create a clear, accurate, and engaging summary of this news article.

Article Title: ${title}
Article Content: ${content.substring(0, 2000)}

${styleInstruction}

Make the summary specific to this article's content and context. Focus on: What happened, who it affects, and why it matters.`

  return askGemini(prompt, 0.3, 300)
}

export async function analyzeFactCheck(title: string, content: string, description = ""): Promise<string> {
  const prompt = `You are a news verification assistant. Perform a credibility assessment of this news article.

TITLE: ${title}
DESCRIPTION: ${description || "No description available"}
CONTENT: ${content || "No content available"}

Please respond in this exact format:
Credibility Score: [number]%
Summary: [2-3 line summary of the article]
Reasons: [brief explanation of factors that influenced the credibility score]`

  return askGemini(prompt, 0.3, 500)
}

export async function generatePersonalizationReason(articleTitle: string, userHistory: string): Promise<string> {
  const prompt = `Write one short reason (under 15 words) why the user would like this article based on their reading habits.

Article: "${articleTitle}"
User History: ${userHistory}

Respond with ONLY the reason, nothing else.`

  return askGemini(prompt, 0.2, 50)
}

export async function generateChatResponse(message: string, context = ""): Promise<string> {
  const prompt = `You are a helpful news assistant. Answer the user's question about news topics.

${context ? `Context: ${context}` : ""}

User Message: ${message}

Provide a helpful, concise response.`

  return askGemini(prompt, 0.5, 300)
}

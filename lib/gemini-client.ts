import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"
import {
  generateWithGemini,
  summarizeWithGemini,
  factCheckWithGemini,
  chatWithGemini,
  generatePersonalizationReasonWithGemini,
} from "./google-cloud-client"

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY

export async function askGemini(prompt: string, temperature = 0.3, maxTokens = 500): Promise<string | null> {
  const geminiResponse = await generateWithGemini(prompt, temperature, maxTokens)
  if (geminiResponse) {
    return geminiResponse
  }

  if (GROQ_API_KEY) {
    try {
      const { text } = await generateText({
        model: groq("llama-3.3-70b-versatile"),
        prompt,
        temperature,
        maxTokens,
      })
      return text
    } catch (error) {
      // Groq failed too
    }
  }

  return null
}

export async function summarizeArticle(title: string, content: string, style = "concise"): Promise<string> {
  const geminiSummary = await summarizeWithGemini(title, content, style)
  if (geminiSummary) {
    return geminiSummary
  }

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

  const response = await askGemini(prompt, 0.3, 300)

  if (response) {
    return response
  }

  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 20)
  const fallbackSummary = sentences.slice(0, 2).join(". ") + "."
  console.log("[v0] Using fallback summary (AI unavailable)")
  return fallbackSummary
}

export async function analyzeFactCheck(title: string, content: string, description = ""): Promise<string> {
  const geminiFactCheck = await factCheckWithGemini(title, content, description)
  if (geminiFactCheck) {
    return geminiFactCheck
  }

  const prompt = `You are a news verification assistant. Perform a credibility assessment of this news article.

TITLE: ${title}
DESCRIPTION: ${description || "No description available"}
CONTENT: ${content || "No content available"}

Please respond in this exact format:
Credibility Score: [number]%
Summary: [2-3 line summary of the article]
Reasons: [brief explanation of factors that influenced the credibility score]`

  const response = await askGemini(prompt, 0.3, 500)

  if (response) {
    return response
  }

  console.log("[v0] Using fallback fact-check (AI unavailable)")
  return `Credibility Score: 75%
Summary: ${description || title}
Reasons: AI fact-checking is temporarily unavailable. Please verify this information from multiple trusted sources.`
}

export async function generatePersonalizationReason(articleTitle: string, userHistory: string): Promise<string> {
  const geminiReason = await generatePersonalizationReasonWithGemini(articleTitle, userHistory)
  if (geminiReason) {
    return geminiReason
  }

  const prompt = `Write one short reason (under 15 words) why the user would like this article based on their reading habits.

Article: "${articleTitle}"
User History: ${userHistory}

Respond with ONLY the reason, nothing else.`

  const response = await askGemini(prompt, 0.2, 50)

  if (response) {
    return response
  }

  console.log("[v0] Using fallback personalization reason (AI unavailable)")
  return "Trending topic in your interests"
}

export async function generateChatResponse(message: string, context = ""): Promise<string> {
  const geminiChat = await chatWithGemini(message, context)
  if (geminiChat) {
    return geminiChat
  }

  const prompt = `You are a helpful news assistant. Answer the user's question about news topics.

${context ? `Context: ${context}` : ""}

User Message: ${message}

Provide a helpful, concise response.`

  const response = await askGemini(prompt, 0.5, 300)

  if (response) {
    return response
  }

  console.log("[v0] Using fallback chat response (AI unavailable)")
  return "I apologize, but the AI assistant is temporarily unavailable. Please check your API keys and quotas in the environment variables, or try again later."
}

// Google Cloud client for Speech-to-Text, Text-to-Speech, and Gemini AI
import { GoogleGenerativeAI } from "@google/generative-ai"

// Get credentials from environment variables
const GOOGLE_CREDENTIALS = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT
  ? JSON.parse(process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT)
  : null

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY

// Initialize Gemini AI client
let genAI: GoogleGenerativeAI | null = null
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
}

export async function generateWithGemini(
  prompt: string,
  temperature = 0.3,
  maxOutputTokens = 500,
): Promise<string | null> {
  if (!genAI) {
    console.error("[Google Cloud] Gemini API key not configured")
    return null
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    })

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens,
      },
    })

    const response = result.response
    return response.text()
  } catch (error: any) {
    console.error("[Google Cloud] Gemini generation error:", error.message)
    return null
  }
}

export async function summarizeWithGemini(title: string, content: string, style = "concise"): Promise<string | null> {
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

  return await generateWithGemini(prompt, 0.3, 300)
}

export async function factCheckWithGemini(title: string, content: string, description = ""): Promise<string | null> {
  const prompt = `You are a news verification assistant. Perform a credibility assessment of this news article.

TITLE: ${title}
DESCRIPTION: ${description || "No description available"}
CONTENT: ${content || "No content available"}

Please respond in this exact format:
Credibility Score: [number]%
Summary: [2-3 line summary of the article]
Reasons: [brief explanation of factors that influenced the credibility score]`

  return await generateWithGemini(prompt, 0.3, 500)
}

export async function chatWithGemini(message: string, context = ""): Promise<string | null> {
  const prompt = `You are a helpful news assistant. Answer the user's question about news topics.

${context ? `Context: ${context}` : ""}

User Message: ${message}

Provide a helpful, concise response.`

  return await generateWithGemini(prompt, 0.5, 300)
}

export async function generatePersonalizationReasonWithGemini(
  articleTitle: string,
  userHistory: string,
): Promise<string | null> {
  const prompt = `Write one short reason (under 15 words) why the user would like this article based on their reading habits.

Article: "${articleTitle}"
User History: ${userHistory}

Respond with ONLY the reason, nothing else.`

  return await generateWithGemini(prompt, 0.2, 50)
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
    }
  }>
}

export async function askGemini(prompt: string, temperature = 0.3, maxTokens = 500): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured")
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          topP: 0.9,
          topK: 40,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gemini API error: ${response.status} - ${error}`)
    }

    const data = (await response.json()) as GeminiResponse

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error("No response from Gemini API")
    }

    return data.candidates[0].content.parts[0].text
  } catch (error) {
    console.error("Gemini API error:", error)
    throw error
  }
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

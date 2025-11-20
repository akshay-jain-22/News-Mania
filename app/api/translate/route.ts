import { type NextRequest, NextResponse } from "next/server"
import { askGemini } from "@/lib/gemini-client"

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang, context } = await request.json()

    if (!text || !targetLang) {
      return NextResponse.json({ error: "Missing required fields: text, targetLang" }, { status: 400 })
    }

    // Map locale codes to full language names
    const languageMap: Record<string, string> = {
      en: "English",
      kn: "Kannada",
      hi: "Hindi",
    }

    const targetLanguage = languageMap[targetLang] || targetLang

    const prompt = context
      ? `Translate the following ${context} to ${targetLanguage}. Maintain the tone and style:\n\n${text}`
      : `Translate the following text to ${targetLanguage}:\n\n${text}`

    const translatedText = await askGemini(prompt)

    if (!translatedText) {
      // Fallback: return original text if translation fails
      return NextResponse.json({ translatedText: text })
    }

    return NextResponse.json({ translatedText })
  } catch (error) {
    console.error("Translation error:", error)
    return NextResponse.json({ error: "Translation failed", translatedText: "" }, { status: 500 })
  }
}

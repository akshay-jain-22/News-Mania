import { askGemini } from "@/lib/gemini-client"

// Translation cache to avoid repeated API calls
const translationCache = new Map<string, string>()

function getCacheKey(text: string, targetLang: string): string {
  return `${targetLang}:${text.substring(0, 100)}`
}

export async function translateText(text: string, targetLang: "en" | "hi" | "kn", context?: string): Promise<string> {
  // Return original if target is English
  if (targetLang === "en" || !text) {
    return text
  }

  // Check cache first
  const cacheKey = getCacheKey(text, targetLang)
  const cached = translationCache.get(cacheKey)
  if (cached) {
    console.log(`[v0] Using cached translation for ${targetLang}`)
    return cached
  }

  try {
    // Map locale codes to full language names
    const languageMap: Record<string, string> = {
      en: "English",
      kn: "Kannada",
      hi: "Hindi",
    }

    const targetLanguage = languageMap[targetLang] || targetLang

    const prompt = context
      ? `Translate the following ${context} to ${targetLanguage}. Maintain the tone, style, and formatting. Only return the translated text without any explanations:\n\n${text}`
      : `Translate the following text to ${targetLanguage}. Maintain the tone and style. Only return the translated text without any explanations:\n\n${text}`

    const translatedText = await askGemini(prompt)

    if (!translatedText) {
      console.warn(`[v0] Translation failed for ${targetLang}, returning original`)
      return text
    }

    // Cache the translation
    translationCache.set(cacheKey, translatedText)

    // Limit cache size to prevent memory issues
    if (translationCache.size > 500) {
      const firstKey = translationCache.keys().next().value
      translationCache.delete(firstKey)
    }

    return translatedText
  } catch (error) {
    console.error(`[v0] Translation error for ${targetLang}:`, error)
    return text
  }
}

// Translate an array of texts in parallel
export async function translateBatch(
  texts: string[],
  targetLang: "en" | "hi" | "kn",
  context?: string,
): Promise<string[]> {
  if (targetLang === "en") {
    return texts
  }

  try {
    const translations = await Promise.all(texts.map((text) => translateText(text, targetLang, context)))
    return translations
  } catch (error) {
    console.error(`[v0] Batch translation error:`, error)
    return texts
  }
}

// Clear translation cache
export function clearTranslationCache(): void {
  translationCache.clear()
  console.log("[v0] Translation cache cleared")
}

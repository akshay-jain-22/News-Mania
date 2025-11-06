import { logger } from "@/lib/logger"
import { askGemini } from "@/lib/gemini-client"

export type LLMProvider = "openai" | "grok" | "gemini"
export type LLMModel = "gpt-4-turbo" | "gpt-4o" | "grok-4" | "gemini-pro"

interface LLMResponse {
  text: string
  modelUsed: string
  tokensUsed: number
  sources: Array<{ source: string; url: string; excerpt: string }>
  requestId: string
  confidence: "High" | "Med" | "Low"
  providerFallbackUsed: boolean
}

interface LLMOptions {
  temperature?: number
  maxTokens?: number
  topP?: number
}

class LLMService {
  private primaryProvider: LLMProvider
  private fallbackProvider: LLMProvider
  private requestCache: Map<string, LLMResponse> = new Map()

  constructor(primaryProvider: LLMProvider = "gemini") {
    this.primaryProvider = primaryProvider
    this.fallbackProvider = "gemini"
  }

  private getModel(provider: LLMProvider, model: LLMModel) {
    return { provider: "gemini", model: "gemini-pro" }
  }

  private isRetryableError(error: unknown): boolean {
    const errorStr = String(error)
    return (
      errorStr.includes("5") || // 5xx errors
      errorStr.includes("timeout") ||
      errorStr.includes("rate_limit") ||
      errorStr.includes("couldn't generate") ||
      errorStr.includes("service unavailable")
    )
  }

  async generate(
    prompt: string,
    model: LLMModel = "gemini-pro",
    options: LLMOptions = {},
    sources: Array<{ source: string; url: string; excerpt: string }> = [],
    requestId = `req_${Date.now()}`,
  ): Promise<LLMResponse> {
    const cacheKey = `${this.primaryProvider}_${model}_${prompt.substring(0, 100)}`

    // Check cache
    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey)!
    }

    const { temperature = 0.3, maxTokens = 500, topP = 0.9 } = options

    try {
      logger.log({
        requestId,
        endpoint: "/api/ml/generate",
        provider: "gemini",
        model: "gemini-pro",
        latency: 0,
      })

      const text = await askGemini(prompt, temperature, maxTokens)

      const response: LLMResponse = {
        text,
        modelUsed: "gemini/gemini-pro",
        tokensUsed: 0,
        sources,
        requestId,
        confidence: "High",
        providerFallbackUsed: false,
      }

      this.requestCache.set(cacheKey, response)
      return response
    } catch (error) {
      logger.log({
        requestId,
        endpoint: "/api/ml/generate",
        provider: "gemini",
        model: "gemini-pro",
        error: String(error),
        latency: 0,
      })

      // Use extractive fallback when Gemini fails
      const extractiveResult = this.extractiveTextRank(prompt, sources)
      return {
        text: extractiveResult,
        modelUsed: "extractive/textrank",
        tokensUsed: 0,
        sources,
        requestId,
        confidence: "Low",
        providerFallbackUsed: true,
      }
    }
  }

  private extractiveTextRank(prompt: string, sources: Array<{ source: string; url: string; excerpt: string }>): string {
    // Simple extractive summarization using TextRank-like approach
    if (sources.length === 0) {
      return "Unable to generate summary at this time. Please try again later."
    }

    const excerpts = sources.map((s) => s.excerpt).filter((e) => e && e.length > 0)

    if (excerpts.length === 0) {
      return "Unable to generate summary at this time. Please try again later."
    }

    // Combine excerpts and extract key sentences
    const combined = excerpts.join(" ")
    const sentences = combined.match(/[^.!?]+[.!?]+/g) || []

    if (sentences.length === 0) {
      return excerpts[0].substring(0, 200) + "..."
    }

    // Return first 2-3 sentences as fallback summary
    return sentences
      .slice(0, 3)
      .map((s) => s.trim())
      .join(" ")
  }

  clearCache() {
    this.requestCache.clear()
  }
}

export const llmService = new LLMService("gemini")

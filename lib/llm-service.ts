import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { xai } from "@ai-sdk/xai"
import { logger } from "@/lib/logger"

export type LLMProvider = "openai" | "grok"
export type LLMModel = "gpt-4-turbo" | "gpt-4o" | "grok-4"

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

  constructor(primaryProvider: LLMProvider = "openai") {
    this.primaryProvider = primaryProvider
    this.fallbackProvider = primaryProvider === "openai" ? "grok" : "openai"
  }

  private getModel(provider: LLMProvider, model: LLMModel) {
    if (provider === "openai") {
      return openai(model === "grok-4" ? "gpt-4-turbo" : model)
    } else {
      return xai(model === "gpt-4-turbo" || model === "gpt-4o" ? "grok-4" : model)
    }
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
    model: LLMModel = "gpt-4-turbo",
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

    let lastError: unknown = null
    let providerFallbackUsed = false

    // Try primary provider
    try {
      logger.log({
        requestId,
        endpoint: "/api/ml/generate",
        provider: this.primaryProvider,
        model,
        latency: 0,
      })

      const primaryModel = this.getModel(this.primaryProvider, model)
      const { text, usage } = await generateText({
        model: primaryModel,
        prompt,
        temperature,
        maxTokens,
        topP,
      })

      const response: LLMResponse = {
        text,
        modelUsed: `${this.primaryProvider}/${model}`,
        tokensUsed: usage?.totalTokens || 0,
        sources,
        requestId,
        confidence: "High",
        providerFallbackUsed: false,
      }

      this.requestCache.set(cacheKey, response)
      return response
    } catch (error) {
      lastError = error
      logger.log({
        requestId,
        endpoint: "/api/ml/generate",
        provider: this.primaryProvider,
        model,
        error: String(error),
        latency: 0,
      })

      if (!this.isRetryableError(error)) {
        throw error
      }
    }

    // Try fallback provider
    try {
      logger.log({
        requestId,
        endpoint: "/api/ml/generate",
        provider: this.fallbackProvider,
        model,
        latency: 0,
      })

      providerFallbackUsed = true
      const fallbackModel = this.getModel(this.fallbackProvider, model)
      const { text, usage } = await generateText({
        model: fallbackModel,
        prompt,
        temperature,
        maxTokens,
        topP,
      })

      const response: LLMResponse = {
        text,
        modelUsed: `${this.fallbackProvider}/${model}`,
        tokensUsed: usage?.totalTokens || 0,
        sources,
        requestId,
        confidence: "Med",
        providerFallbackUsed: true,
      }

      this.requestCache.set(cacheKey, response)
      return response
    } catch (fallbackError) {
      logger.log({
        requestId,
        endpoint: "/api/ml/generate",
        provider: this.fallbackProvider,
        model,
        error: String(fallbackError),
        latency: 0,
      })

      // Both providers failed, return cached result or extractive fallback
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

export const llmService = new LLMService((process.env.LLM_PROVIDER as LLMProvider) || "openai")

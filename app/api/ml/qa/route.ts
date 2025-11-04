import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { buildRagContext, buildQaPrompt, getQaCacheKey } from "@/lib/rag-pipeline"
import { verifyAuthToken, checkRateLimit } from "@/lib/auth-utils"
import { createServerSupabaseClient } from "@/lib/supabase"
import { llmService } from "@/lib/llm-service"

const qaSchema = z.object({
  articleId: z.string().min(1),
  userId: z.string().optional(),
  question: z.string().min(5, "Question must be at least 5 characters"),
  maxContextTokens: z.number().default(2000),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request)
    const userId = auth?.userId

    if (userId && !checkRateLimit(`qa:${userId}`, 20, 60000)) {
      return NextResponse.json({ error: "Rate limit exceeded. Maximum 20 questions per minute." }, { status: 429 })
    }

    const body = await request.json()
    const { articleId, question, maxContextTokens } = qaSchema.parse(body)

    const supabase = createServerSupabaseClient()

    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("*")
      .eq("id", articleId)
      .single()

    if (articleError || !article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    const cacheKey = getQaCacheKey(articleId, question)
    const { data: cachedAnswer } = await supabase.from("qa_cache").select("*").eq("cache_key", cacheKey).single()

    if (cachedAnswer) {
      return NextResponse.json(
        {
          answer: cachedAnswer.answer,
          modelUsed: cachedAnswer.model_used,
          tokensUsed: cachedAnswer.tokens_used,
          sources: cachedAnswer.sources,
          requestId: cachedAnswer.request_id,
          confidence: cachedAnswer.confidence || "Med",
          cacheHit: true,
          providerFallbackUsed: cachedAnswer.provider_fallback_used || false,
        },
        { status: 200 },
      )
    }

    const ragContext = await buildRagContext(
      articleId,
      article.title,
      article.source,
      article.content,
      article.published_at,
      article.credibility_score || 75,
      5,
    )

    const prompt = buildQaPrompt(ragContext, question)

    const llmResponse = await llmService.generate(
      prompt,
      "gpt-4-turbo",
      {
        temperature: 0.4,
        maxTokens: 500,
      },
      ragContext.passages,
      ragContext.requestId,
    )

    await supabase.from("qa_cache").insert({
      cache_key: cacheKey,
      article_id: articleId,
      question,
      answer: llmResponse.text,
      model_used: llmResponse.modelUsed,
      tokens_used: llmResponse.tokensUsed,
      sources: llmResponse.sources,
      request_id: llmResponse.requestId,
      confidence: llmResponse.confidence,
      provider_fallback_used: llmResponse.providerFallbackUsed,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })

    if (userId) {
      await supabase.from("interactions").insert({
        user_id: userId,
        article_id: articleId,
        action: "qa",
        question: question,
        request_id: llmResponse.requestId,
        model_used: llmResponse.modelUsed,
        provider_used: llmResponse.modelUsed.split("/")[0],
        tokens_used: llmResponse.tokensUsed,
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json(
      {
        answer: llmResponse.text,
        modelUsed: llmResponse.modelUsed,
        tokensUsed: llmResponse.tokensUsed,
        sources: llmResponse.sources,
        requestId: llmResponse.requestId,
        confidence: llmResponse.confidence,
        cacheHit: false,
        providerFallbackUsed: llmResponse.providerFallbackUsed,
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("Q&A error:", error)
    return NextResponse.json({ error: "Failed to generate answer", retryAfter: 60 }, { status: 503 })
  }
}

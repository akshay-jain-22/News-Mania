import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generateText } from "ai"
import { buildRagContext, buildSummarizationPrompt, getSummarizationCacheKey } from "@/lib/rag-pipeline"
import { verifyAuthToken, checkRateLimit } from "@/lib/auth-utils"
import { createServerSupabaseClient } from "@/lib/supabase"

const summarizeSchema = z.object({
  articleId: z.string().min(1),
  userId: z.string().optional(),
  length: z.enum(["short", "medium", "long"]).default("medium"),
  deterministic: z.boolean().default(false),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request)
    const userId = auth?.userId

    if (userId && !checkRateLimit(`summarize:${userId}`, 10, 60000)) {
      return NextResponse.json({ error: "Rate limit exceeded. Maximum 10 summarizations per minute." }, { status: 429 })
    }

    const body = await request.json()
    const { articleId, length, deterministic } = summarizeSchema.parse(body)

    const supabase = createServerSupabaseClient()

    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("*")
      .eq("id", articleId)
      .single()

    if (articleError || !article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 })
    }

    const cacheKey = getSummarizationCacheKey(articleId, length, deterministic)
    const { data: cachedSummary } = await supabase
      .from("summarization_cache")
      .select("*")
      .eq("cache_key", cacheKey)
      .single()

    if (cachedSummary && !deterministic) {
      return NextResponse.json(
        {
          summary: cachedSummary.summary,
          modelUsed: cachedSummary.model_used,
          tokensUsed: cachedSummary.tokens_used,
          sources: cachedSummary.sources,
          requestId: cachedSummary.request_id,
          cacheHit: true,
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

    const prompt = buildSummarizationPrompt(ragContext, length)

    const { text: summary, usage } = await generateText({
      model: "openai/gpt-4-turbo",
      prompt,
      temperature: deterministic ? 0.1 : 0.3,
      maxTokens: length === "short" ? 100 : length === "medium" ? 200 : 300,
    })

    await supabase.from("summarization_cache").insert({
      cache_key: cacheKey,
      article_id: articleId,
      summary,
      model_used: "openai/gpt-4-turbo",
      tokens_used: usage?.totalTokens || 0,
      sources: ragContext.passages,
      request_id: ragContext.requestId,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })

    if (userId) {
      await supabase.from("ml_requests").insert({
        user_id: userId,
        request_type: "summarize",
        article_id: articleId,
        model_used: "openai/gpt-4-turbo",
        tokens_used: usage?.totalTokens || 0,
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json(
      {
        summary,
        modelUsed: "openai/gpt-4-turbo",
        tokensUsed: usage?.totalTokens || 0,
        sources: ragContext.passages,
        requestId: ragContext.requestId,
        cacheHit: false,
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("Summarization error:", error)
    return NextResponse.json({ error: "Failed to generate summary", retryAfter: 60 }, { status: 503 })
  }
}

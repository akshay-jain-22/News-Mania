import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { generateText } from "ai"
import { buildRagContext, buildQaPrompt, getQaCacheKey } from "@/lib/rag-pipeline"
import { verifyAuthToken, checkRateLimit } from "@/lib/auth-utils"
import { createServerSupabaseClient } from "@/lib/supabase"

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

    const prompt = buildQaPrompt(ragContext, question)

    const { text: answer, usage } = await generateText({
      model: "openai/gpt-4-turbo",
      prompt,
      temperature: 0.4,
      maxTokens: 500,
    })

    await supabase.from("qa_cache").insert({
      cache_key: cacheKey,
      article_id: articleId,
      question,
      answer,
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
        request_type: "qa",
        article_id: articleId,
        model_used: "openai/gpt-4-turbo",
        tokens_used: usage?.totalTokens || 0,
        created_at: new Date().toISOString(),
      })
    }

    return NextResponse.json(
      {
        answer,
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

    console.error("Q&A error:", error)
    return NextResponse.json({ error: "Failed to generate answer", retryAfter: 60 }, { status: 503 })
  }
}

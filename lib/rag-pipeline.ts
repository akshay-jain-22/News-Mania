import { generateEmbedding } from "@/lib/embeddings"

export interface RagSource {
  source: string
  url: string
  excerpt: string
  score: number
}

export interface RagContext {
  title: string
  source: string
  publishedAt: string
  credibilityScore: number
  passages: RagSource[]
  requestId: string
}

/**
 * Retrieve top-K passages from vector DB for an article
 */
export async function retrieveArticlePassages(
  articleId: string,
  articleContent: string,
  topK = 5,
): Promise<RagSource[]> {
  try {
    const embedding = await generateEmbedding(articleContent)

    if (!embedding) {
      console.error("Failed to generate embedding for article")
      return []
    }

    const response = await fetch(`${process.env.UPSTASH_VECTOR_REST_URL}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_VECTOR_REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vector: embedding,
        topK,
        includeMetadata: true,
      }),
    })

    if (!response.ok) {
      console.error("Vector DB query failed:", response.statusText)
      return []
    }

    const data = await response.json()

    return (data.results || []).map((result: any) => ({
      source: result.metadata?.source || "Unknown",
      url: result.metadata?.url || "",
      excerpt: result.metadata?.excerpt || "",
      score: result.score || 0,
    }))
  } catch (error) {
    console.error("Error retrieving passages:", error)
    return []
  }
}

/**
 * Build RAG context for LLM prompt
 */
export async function buildRagContext(
  articleId: string,
  articleTitle: string,
  articleSource: string,
  articleContent: string,
  publishedAt: string,
  credibilityScore: number,
  topK = 5,
): Promise<RagContext> {
  const requestId = `rag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const passages = await retrieveArticlePassages(articleId, articleContent, topK)

  return {
    title: articleTitle,
    source: articleSource,
    publishedAt,
    credibilityScore,
    passages,
    requestId,
  }
}

/**
 * Build prompt for summarization with RAG context
 */
export function buildSummarizationPrompt(context: RagContext, length: "short" | "medium" | "long" = "medium"): string {
  const lengthGuide = {
    short: "2-3 sentences",
    medium: "3-5 sentences",
    long: "5-8 sentences",
  }

  const passagesText = context.passages.map((p, i) => `[${i + 1}] "${p.excerpt}" (Source: ${p.source})`).join("\n")

  return `You are a professional news summarizer. Summarize the following article in ${lengthGuide[length]}.

Article: "${context.title}"
Source: ${context.source}
Published: ${context.publishedAt}
Credibility Score: ${context.credibilityScore}%

Key passages from the article:
${passagesText}

IMPORTANT RULES:
1. Use ONLY the passages provided above. Do NOT invent facts.
2. Cite up to 3 sources inline using [1], [2], [3] format.
3. Provide a certainty score at the end: (Certainty: High/Medium/Low)
4. Keep the summary factual and neutral.
5. Do not add opinions or speculation.

Summary:`
}

/**
 * Build prompt for Q&A with RAG context
 */
export function buildQaPrompt(context: RagContext, question: string): string {
  const passagesText = context.passages.map((p, i) => `[${i + 1}] "${p.excerpt}" (Source: ${p.source})`).join("\n")

  return `You are a knowledgeable news analyst. Answer the following question based ONLY on the provided article passages.

Article: "${context.title}"
Source: ${context.source}
Published: ${context.publishedAt}

Question: ${question}

Key passages from the article:
${passagesText}

IMPORTANT RULES:
1. Use ONLY the passages provided above. Do NOT invent facts or use external knowledge.
2. If the question cannot be answered from the passages, say "This information is not available in the article."
3. Cite sources inline using [1], [2], [3] format.
4. Provide a certainty score: (Certainty: High/Medium/Low)
5. Keep your answer concise and factual.

Answer:`
}

/**
 * Cache key generator for summarization
 */
export function getSummarizationCacheKey(articleId: string, length: string, deterministic: boolean): string {
  return `summarize:${articleId}:${length}:${deterministic}`
}

/**
 * Cache key generator for Q&A
 */
export function getQaCacheKey(articleId: string, question: string): string {
  return `qa:${articleId}:${Buffer.from(question).toString("base64")}`
}

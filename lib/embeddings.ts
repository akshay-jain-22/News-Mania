import { generateEmbedding as generateOpenAIEmbedding } from "ai"

/**
 * Generate embedding for text using OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    if (!text || text.length === 0) {
      return null
    }

    const embedding = await generateOpenAIEmbedding("openai.embedding.3-small", text)

    return embedding
  } catch (error) {
    console.error("Error generating embedding:", error)
    return null
  }
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
  try {
    return await Promise.all(texts.map((text) => generateEmbedding(text)))
  } catch (error) {
    console.error("Error generating embeddings:", error)
    return texts.map(() => null)
  }
}

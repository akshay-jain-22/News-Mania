import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { groq } from "@ai-sdk/groq"
import { xai } from "@ai-sdk/xai"

export interface NewsItem {
  title: string
  description?: string
  content?: string
  url: string
  urlToImage?: string
  publishedAt: string
  source?: {
    name: string
  }
}

export interface ContextAnalysis {
  summary: string
  keyPoints: string[]
  sentiment: "positive" | "negative" | "neutral"
  credibility: "high" | "medium" | "low"
  bias: "left" | "right" | "center"
  topics: string[]
  relatedQuestions: string[]
}

// Get news context analysis - REQUIRED EXPORT
export async function getNewsContext(article: NewsItem): Promise<ContextAnalysis> {
  try {
    console.log("Analyzing news context for:", article.title)

    const articleText = `
Title: ${article.title}
Description: ${article.description || "No description available"}
Content: ${article.content || "No content available"}
Source: ${article.source?.name || "Unknown source"}
Published: ${article.publishedAt}
    `.trim()

    // Try multiple AI providers with fallbacks
    const providers = [
      { name: "Groq", model: groq("llama-3.3-70b-versatile") },
      { name: "OpenAI", model: openai("gpt-4o-mini") },
      { name: "xAI", model: xai("grok-beta") },
    ]

    for (const provider of providers) {
      try {
        console.log(`Trying ${provider.name} for context analysis...`)

        const { text } = await generateText({
          model: provider.model,
          prompt: `Analyze this news article and provide a comprehensive context analysis:

${articleText}

Please provide a JSON response with the following structure:
{
  "summary": "Brief 2-3 sentence summary of the article",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "sentiment": "positive|negative|neutral",
  "credibility": "high|medium|low",
  "bias": "left|right|center", 
  "topics": ["topic1", "topic2", "topic3"],
  "relatedQuestions": ["question 1?", "question 2?", "question 3?"]
}

Base your analysis on:
- Content accuracy and source reliability
- Language tone and emotional content
- Political or ideological leanings
- Main themes and subjects covered
- Questions readers might have

Respond only with valid JSON.`,
          maxTokens: 1000,
        })

        // Try to parse the JSON response
        try {
          const analysis = JSON.parse(text)

          // Validate the response structure
          if (analysis.summary && analysis.keyPoints && analysis.sentiment) {
            console.log(`Successfully analyzed with ${provider.name}`)
            return {
              summary: analysis.summary,
              keyPoints: Array.isArray(analysis.keyPoints) ? analysis.keyPoints : [],
              sentiment: ["positive", "negative", "neutral"].includes(analysis.sentiment)
                ? analysis.sentiment
                : "neutral",
              credibility: ["high", "medium", "low"].includes(analysis.credibility) ? analysis.credibility : "medium",
              bias: ["left", "right", "center"].includes(analysis.bias) ? analysis.bias : "center",
              topics: Array.isArray(analysis.topics) ? analysis.topics : [],
              relatedQuestions: Array.isArray(analysis.relatedQuestions) ? analysis.relatedQuestions : [],
            }
          }
        } catch (parseError) {
          console.warn(`Failed to parse JSON from ${provider.name}:`, parseError)
          continue
        }
      } catch (providerError) {
        console.warn(`${provider.name} failed:`, providerError)
        continue
      }
    }

    // Fallback analysis if all AI providers fail
    console.log("All AI providers failed, using fallback analysis")
    return generateFallbackAnalysis(article)
  } catch (error) {
    console.error("Error in getNewsContext:", error)
    return generateFallbackAnalysis(article)
  }
}

// Get article context (alias for backward compatibility)
export async function getArticleContext(article: NewsItem): Promise<ContextAnalysis> {
  return getNewsContext(article)
}

// Ask a question about an article
export async function askQuestionAboutArticle(article: NewsItem, question: string): Promise<string> {
  try {
    console.log("Answering question about article:", question)

    const articleText = `
Title: ${article.title}
Description: ${article.description || "No description available"}
Content: ${article.content || "No content available"}
Source: ${article.source?.name || "Unknown source"}
Published: ${article.publishedAt}
    `.trim()

    // Try multiple AI providers
    const providers = [
      { name: "Groq", model: groq("llama-3.3-70b-versatile") },
      { name: "OpenAI", model: openai("gpt-4o-mini") },
      { name: "xAI", model: xai("grok-beta") },
    ]

    for (const provider of providers) {
      try {
        console.log(`Trying ${provider.name} for question answering...`)

        const { text } = await generateText({
          model: provider.model,
          prompt: `Based on this news article, please answer the following question:

Article:
${articleText}

Question: ${question}

Please provide a clear, informative answer based on the article content. If the article doesn't contain enough information to answer the question, say so and provide what context you can from the available information.`,
          maxTokens: 500,
        })

        if (text && text.trim().length > 10) {
          console.log(`Successfully answered with ${provider.name}`)
          return text.trim()
        }
      } catch (providerError) {
        console.warn(`${provider.name} failed for question:`, providerError)
        continue
      }
    }

    // Fallback response
    return generateFallbackAnswer(article, question)
  } catch (error) {
    console.error("Error answering question:", error)
    return generateFallbackAnswer(article, question)
  }
}

// Generate summary of an article
export async function generateSummary(article: NewsItem): Promise<string> {
  try {
    console.log("Generating summary for:", article.title)

    const articleText = `
Title: ${article.title}
Description: ${article.description || "No description available"}
Content: ${article.content || "No content available"}
    `.trim()

    // Try multiple AI providers
    const providers = [
      { name: "Groq", model: groq("llama-3.3-70b-versatile") },
      { name: "OpenAI", model: openai("gpt-4o-mini") },
      { name: "xAI", model: xai("grok-beta") },
    ]

    for (const provider of providers) {
      try {
        console.log(`Trying ${provider.name} for summary generation...`)

        const { text } = await generateText({
          model: provider.model,
          prompt: `Please provide a concise 2-3 sentence summary of this news article:

${articleText}

Focus on the main facts and key information. Keep it objective and informative.`,
          maxTokens: 200,
        })

        if (text && text.trim().length > 20) {
          console.log(`Successfully summarized with ${provider.name}`)
          return text.trim()
        }
      } catch (providerError) {
        console.warn(`${provider.name} failed for summary:`, providerError)
        continue
      }
    }

    // Fallback summary
    return generateFallbackSummary(article)
  } catch (error) {
    console.error("Error generating summary:", error)
    return generateFallbackSummary(article)
  }
}

// Analyze article sentiment
export async function analyzeSentiment(article: NewsItem): Promise<"positive" | "negative" | "neutral"> {
  try {
    const context = await getNewsContext(article)
    return context.sentiment
  } catch (error) {
    console.error("Error analyzing sentiment:", error)
    return "neutral"
  }
}

// Get related topics
export async function getRelatedTopics(article: NewsItem): Promise<string[]> {
  try {
    const context = await getNewsContext(article)
    return context.topics
  } catch (error) {
    console.error("Error getting related topics:", error)
    return extractFallbackTopics(article)
  }
}

// Helper function to generate fallback analysis
function generateFallbackAnalysis(article: NewsItem): ContextAnalysis {
  const title = article.title.toLowerCase()
  const description = (article.description || "").toLowerCase()
  const content = (article.content || "").toLowerCase()
  const fullText = `${title} ${description} ${content}`

  // Simple sentiment analysis based on keywords
  const positiveWords = [
    "success",
    "growth",
    "improvement",
    "breakthrough",
    "achievement",
    "positive",
    "good",
    "great",
    "excellent",
  ]
  const negativeWords = [
    "crisis",
    "problem",
    "decline",
    "failure",
    "concern",
    "issue",
    "negative",
    "bad",
    "terrible",
    "disaster",
  ]

  const positiveCount = positiveWords.filter((word) => fullText.includes(word)).length
  const negativeCount = negativeWords.filter((word) => fullText.includes(word)).length

  let sentiment: "positive" | "negative" | "neutral" = "neutral"
  if (positiveCount > negativeCount) sentiment = "positive"
  else if (negativeCount > positiveCount) sentiment = "negative"

  // Extract topics based on common keywords
  const topics = extractFallbackTopics(article)

  // Generate basic summary
  const summary =
    article.description ||
    `This article discusses ${article.title.toLowerCase()}. Published by ${article.source?.name || "unknown source"}.`

  return {
    summary,
    keyPoints: [
      `Article published by ${article.source?.name || "unknown source"}`,
      `Published on ${new Date(article.publishedAt).toLocaleDateString()}`,
      "Content analysis performed using fallback method",
    ],
    sentiment,
    credibility: "medium",
    bias: "center",
    topics,
    relatedQuestions: [
      "What are the main facts in this article?",
      "Who are the key people or organizations mentioned?",
      "What is the significance of this news?",
    ],
  }
}

// Helper function to extract topics from article
function extractFallbackTopics(article: NewsItem): string[] {
  const title = article.title.toLowerCase()
  const description = (article.description || "").toLowerCase()
  const fullText = `${title} ${description}`

  const topicKeywords = {
    Technology: ["tech", "ai", "artificial intelligence", "software", "computer", "digital", "internet", "app"],
    Politics: ["government", "election", "policy", "political", "congress", "senate", "president", "vote"],
    Business: ["business", "company", "market", "economy", "financial", "stock", "investment", "corporate"],
    Health: ["health", "medical", "hospital", "doctor", "disease", "treatment", "medicine", "healthcare"],
    Sports: ["sports", "game", "team", "player", "championship", "league", "match", "tournament"],
    Science: ["science", "research", "study", "scientist", "discovery", "experiment", "scientific"],
    Environment: ["climate", "environment", "green", "pollution", "sustainability", "renewable", "carbon"],
    Entertainment: ["movie", "music", "celebrity", "entertainment", "film", "show", "actor", "artist"],
  }

  const detectedTopics: string[] = []

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((keyword) => fullText.includes(keyword))) {
      detectedTopics.push(topic)
    }
  }

  return detectedTopics.length > 0 ? detectedTopics : ["General News"]
}

// Helper function to generate fallback answer
function generateFallbackAnswer(article: NewsItem, question: string): string {
  const questionLower = question.toLowerCase()

  if (questionLower.includes("what") || questionLower.includes("summary")) {
    return `Based on the article "${article.title}", this appears to be a news story published by ${article.source?.name || "an unknown source"} on ${new Date(article.publishedAt).toLocaleDateString()}. ${article.description || "No additional details are available in the article preview."}`
  }

  if (questionLower.includes("when")) {
    return `According to the article information, this was published on ${new Date(article.publishedAt).toLocaleDateString()}.`
  }

  if (questionLower.includes("who")) {
    return `This article was published by ${article.source?.name || "an unknown source"}. For specific people mentioned in the article, you would need to read the full content.`
  }

  if (questionLower.includes("where")) {
    return `The article "${article.title}" was published by ${article.source?.name || "an unknown source"}. For specific locations mentioned, please refer to the full article content.`
  }

  return `I can see this article is titled "${article.title}" and was published by ${article.source?.name || "an unknown source"} on ${new Date(article.publishedAt).toLocaleDateString()}. For more specific details about your question, I would need access to the full article content.`
}

// Helper function to generate fallback summary
function generateFallbackSummary(article: NewsItem): string {
  if (article.description) {
    return article.description
  }

  return `This is a news article titled "${article.title}" published by ${article.source?.name || "an unknown source"} on ${new Date(article.publishedAt).toLocaleDateString()}.`
}

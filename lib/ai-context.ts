import { generateText } from "ai"
import { xai } from "@ai-sdk/xai"
import { openai } from "@ai-sdk/openai"

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

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface AIContextResponse {
  summary: string
  keyPoints: string[]
  sentiment: "positive" | "negative" | "neutral"
  topics: string[]
  readingTime: number
}

/**
 * Analyze question type to provide better responses
 */
function analyzeQuestionType(question: string): {
  type: "general" | "specific" | "opinion" | "factual" | "sports" | "technology" | "politics"
  keywords: string[]
} {
  const lowerQuestion = question.toLowerCase()

  // Sports keywords
  const sportsKeywords = [
    "game",
    "match",
    "team",
    "player",
    "score",
    "win",
    "lose",
    "championship",
    "league",
    "tournament",
    "coach",
    "season",
  ]

  // Technology keywords
  const techKeywords = [
    "ai",
    "technology",
    "software",
    "app",
    "digital",
    "computer",
    "internet",
    "data",
    "algorithm",
    "innovation",
  ]

  // Politics keywords
  const politicsKeywords = [
    "government",
    "election",
    "policy",
    "president",
    "congress",
    "vote",
    "political",
    "democracy",
    "law",
    "legislation",
  ]

  // Opinion indicators
  const opinionKeywords = ["think", "believe", "opinion", "feel", "should", "better", "worse", "prefer"]

  // Factual indicators
  const factualKeywords = ["what", "when", "where", "who", "how", "why", "explain", "define"]

  let type: "general" | "specific" | "opinion" | "factual" | "sports" | "technology" | "politics" = "general"
  const foundKeywords: string[] = []

  // Check for sports
  if (sportsKeywords.some((keyword) => lowerQuestion.includes(keyword))) {
    type = "sports"
    foundKeywords.push(...sportsKeywords.filter((keyword) => lowerQuestion.includes(keyword)))
  }
  // Check for technology
  else if (techKeywords.some((keyword) => lowerQuestion.includes(keyword))) {
    type = "technology"
    foundKeywords.push(...techKeywords.filter((keyword) => lowerQuestion.includes(keyword)))
  }
  // Check for politics
  else if (politicsKeywords.some((keyword) => lowerQuestion.includes(keyword))) {
    type = "politics"
    foundKeywords.push(...politicsKeywords.filter((keyword) => lowerQuestion.includes(keyword)))
  }
  // Check for opinion
  else if (opinionKeywords.some((keyword) => lowerQuestion.includes(keyword))) {
    type = "opinion"
    foundKeywords.push(...opinionKeywords.filter((keyword) => lowerQuestion.includes(keyword)))
  }
  // Check for factual
  else if (factualKeywords.some((keyword) => lowerQuestion.includes(keyword))) {
    type = "factual"
    foundKeywords.push(...factualKeywords.filter((keyword) => lowerQuestion.includes(keyword)))
  }
  // Check if specific (contains specific terms or names)
  else if (lowerQuestion.length > 50 || /[A-Z][a-z]+/.test(question)) {
    type = "specific"
  }

  return { type, keywords: foundKeywords }
}

/**
 * Generate AI context for a news article
 */
export async function generateNewsContext(article: NewsItem): Promise<AIContextResponse> {
  try {
    const articleText = `
Title: ${article.title}
Description: ${article.description || "No description available"}
Content: ${article.content || "No content available"}
Source: ${article.source?.name || "Unknown source"}
Published: ${article.publishedAt}
    `.trim()

    // Try Grok first
    try {
      const { text } = await generateText({
        model: xai("grok-beta"),
        prompt: `Analyze this news article and provide a structured response:

${articleText}

Please provide:
1. A concise summary (2-3 sentences)
2. Key points (3-5 bullet points)
3. Sentiment (positive/negative/neutral)
4. Main topics/categories
5. Estimated reading time in minutes

Format your response as JSON with these fields: summary, keyPoints (array), sentiment, topics (array), readingTime (number).`,
        maxTokens: 500,
      })

      const parsed = JSON.parse(text)
      return {
        summary: parsed.summary || "Article analysis completed.",
        keyPoints: parsed.keyPoints || ["Key information extracted from article"],
        sentiment: parsed.sentiment || "neutral",
        topics: parsed.topics || ["General News"],
        readingTime: parsed.readingTime || 2,
      }
    } catch (grokError) {
      console.log("Grok failed, trying OpenAI:", grokError)

      // Fallback to OpenAI
      try {
        const { text } = await generateText({
          model: openai("gpt-3.5-turbo"),
          prompt: `Analyze this news article: ${articleText}

Provide a JSON response with: summary, keyPoints (array), sentiment, topics (array), readingTime (number).`,
          maxTokens: 400,
        })

        const parsed = JSON.parse(text)
        return {
          summary: parsed.summary || "Article analysis completed.",
          keyPoints: parsed.keyPoints || ["Key information extracted"],
          sentiment: parsed.sentiment || "neutral",
          topics: parsed.topics || ["News"],
          readingTime: parsed.readingTime || 2,
        }
      } catch (openaiError) {
        console.log("OpenAI failed, using fallback:", openaiError)

        // Smart fallback based on article content
        return generateFallbackContext(article)
      }
    }
  } catch (error) {
    console.error("Error generating news context:", error)
    return generateFallbackContext(article)
  }
}

/**
 * Generate fallback context when AI services fail
 */
function generateFallbackContext(article: NewsItem): AIContextResponse {
  const title = article.title || "News Article"
  const description = article.description || ""
  const content = article.content || ""
  const fullText = `${title} ${description} ${content}`.toLowerCase()

  // Determine sentiment based on keywords
  const positiveWords = ["success", "growth", "improvement", "breakthrough", "achievement", "victory", "progress"]
  const negativeWords = ["crisis", "problem", "decline", "failure", "concern", "issue", "controversy"]

  const positiveCount = positiveWords.filter((word) => fullText.includes(word)).length
  const negativeCount = negativeWords.filter((word) => fullText.includes(word)).length

  let sentiment: "positive" | "negative" | "neutral" = "neutral"
  if (positiveCount > negativeCount) sentiment = "positive"
  else if (negativeCount > positiveCount) sentiment = "negative"

  // Determine topics based on keywords
  const topics: string[] = []
  if (fullText.includes("technology") || fullText.includes("ai") || fullText.includes("tech")) topics.push("Technology")
  if (fullText.includes("sports") || fullText.includes("game") || fullText.includes("team")) topics.push("Sports")
  if (fullText.includes("politics") || fullText.includes("government") || fullText.includes("election"))
    topics.push("Politics")
  if (fullText.includes("business") || fullText.includes("economy") || fullText.includes("market"))
    topics.push("Business")
  if (fullText.includes("health") || fullText.includes("medical") || fullText.includes("healthcare"))
    topics.push("Health")
  if (topics.length === 0) topics.push("General News")

  // Estimate reading time (average 200 words per minute)
  const wordCount = fullText.split(" ").length
  const readingTime = Math.max(1, Math.ceil(wordCount / 200))

  return {
    summary: description || `This article discusses ${title.toLowerCase()}.`,
    keyPoints: [
      `Article published by ${article.source?.name || "news source"}`,
      `Published on ${new Date(article.publishedAt).toLocaleDateString()}`,
      "Contains relevant news information",
    ],
    sentiment,
    topics,
    readingTime,
  }
}

/**
 * Generate AI chat response
 */
export async function generateChatResponse(
  question: string,
  article: NewsItem,
  chatHistory: ChatMessage[] = [],
): Promise<string> {
  try {
    const questionAnalysis = analyzeQuestionType(question)

    const articleContext = `
Article: ${article.title}
Description: ${article.description || "No description"}
Content: ${article.content || "No content available"}
Source: ${article.source?.name || "Unknown"}
Published: ${article.publishedAt}
    `.trim()

    const historyContext =
      chatHistory.length > 0
        ? `Previous conversation:\n${chatHistory
            .slice(-3)
            .map((msg) => `${msg.role}: ${msg.content}`)
            .join("\n")}\n\n`
        : ""

    const systemPrompt = `You are a helpful news assistant. Answer questions about the provided article context. Be concise and informative.

${historyContext}Article Context:
${articleContext}

User Question: ${question}

Provide a helpful response based on the article content. If the question is not directly related to the article, provide general knowledge while acknowledging the article context.`

    // Try Grok first
    try {
      const { text } = await generateText({
        model: xai("grok-beta"),
        prompt: systemPrompt,
        maxTokens: 300,
      })
      return text || generateFallbackResponse(question, article, questionAnalysis)
    } catch (grokError) {
      console.log("Grok failed, trying OpenAI:", grokError)

      // Fallback to OpenAI
      try {
        const { text } = await generateText({
          model: openai("gpt-3.5-turbo"),
          prompt: systemPrompt,
          maxTokens: 250,
        })
        return text || generateFallbackResponse(question, article, questionAnalysis)
      } catch (openaiError) {
        console.log("OpenAI failed, using smart fallback:", openaiError)
        return generateFallbackResponse(question, article, questionAnalysis)
      }
    }
  } catch (error) {
    console.error("Error generating chat response:", error)
    return generateFallbackResponse(question, article, analyzeQuestionType(question))
  }
}

/**
 * Generate smart fallback responses when AI services fail
 */
function generateFallbackResponse(
  question: string,
  article: NewsItem,
  analysis: { type: string; keywords: string[] },
): string {
  const lowerQuestion = question.toLowerCase()

  // Handle single word questions
  if (question.trim().split(" ").length === 1) {
    const word = question.toLowerCase()
    if (word === "summary" || word === "summarize") {
      return `Here's a summary: ${article.title}. ${article.description || "This article provides important news information."}`
    }
    if (word === "source") {
      return `This article is from ${article.source?.name || "a news source"}.`
    }
    if (word === "when") {
      return `This article was published on ${new Date(article.publishedAt).toLocaleDateString()}.`
    }
    return `Regarding "${question}": Based on the article "${article.title}", I can provide relevant information. ${article.description || "The article contains important details on this topic."}`
  }

  // Sports-specific responses
  if (analysis.type === "sports") {
    const sportsTerms = analysis.keywords.join(", ")
    return `This appears to be a sports-related question about ${sportsTerms}. Based on the article "${article.title}", ${article.description || "there are relevant sports developments to discuss."} The article was published by ${article.source?.name || "a sports news source"}.`
  }

  // Technology-specific responses
  if (analysis.type === "technology") {
    return `This is a technology-related question. The article "${article.title}" discusses relevant tech developments. ${article.description || "It covers important technological advancements and their implications."}`
  }

  // Politics-specific responses
  if (analysis.type === "politics") {
    return `This appears to be a political question. The article "${article.title}" provides context on political developments. ${article.description || "It covers important policy and governance topics."}`
  }

  // Opinion questions
  if (analysis.type === "opinion") {
    return `That's an interesting perspective question. Based on the article "${article.title}", there are various viewpoints to consider. ${article.description || "The article presents information that can help form informed opinions on this topic."}`
  }

  // Factual questions
  if (analysis.type === "factual") {
    return `Based on the article "${article.title}": ${article.description || "The article provides factual information on this topic."} Published by ${article.source?.name || "a reliable news source"} on ${new Date(article.publishedAt).toLocaleDateString()}.`
  }

  // Handle common question patterns
  if (lowerQuestion.includes("what") && lowerQuestion.includes("about")) {
    return `This article is about: ${article.title}. ${article.description || "It provides important news and information on the topic."}`
  }

  if (lowerQuestion.includes("who")) {
    return `According to the article "${article.title}" from ${article.source?.name || "the news source"}, ${article.description || "there are key people and organizations involved in this story."}`
  }

  if (lowerQuestion.includes("when")) {
    return `This article was published on ${new Date(article.publishedAt).toLocaleDateString()}. ${article.description || "It covers recent developments in the news."}`
  }

  if (lowerQuestion.includes("where")) {
    return `Based on the article "${article.title}", ${article.description || "the events and information discussed have specific geographic relevance."}`
  }

  if (lowerQuestion.includes("why")) {
    return `The article "${article.title}" explains the context and reasons behind these developments. ${article.description || "It provides background and analysis on the underlying causes."}`
  }

  if (lowerQuestion.includes("how")) {
    return `According to the article "${article.title}", ${article.description || "there are specific processes and methods involved in this story."}`
  }

  // Default response with article context
  return `Based on the article "${article.title}" from ${article.source?.name || "the news source"}: ${article.description || "This article provides relevant information that can help answer your question."} Feel free to ask more specific questions about the content.`
}

/**
 * Summarize article content
 */
export async function summarizeArticle(article: NewsItem): Promise<string> {
  try {
    const context = await generateNewsContext(article)
    return context.summary
  } catch (error) {
    console.error("Error summarizing article:", error)
    return article.description || `Summary of: ${article.title}`
  }
}

/**
 * Extract key topics from article
 */
export async function extractTopics(article: NewsItem): Promise<string[]> {
  try {
    const context = await generateNewsContext(article)
    return context.topics
  } catch (error) {
    console.error("Error extracting topics:", error)
    return ["General News"]
  }
}

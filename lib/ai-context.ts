import type { NewsArticle } from "@/types/news"

export interface AIContextResponse {
  summary: string
  keyPoints: string[]
  sentiment: "positive" | "negative" | "neutral"
  topics: string[]
  credibilityAssessment: string
  relatedQuestions: string[]
}

export async function getNewsContext(title: string, description: string, content: string): Promise<string> {
  try {
    console.log("Requesting context for article:", title)

    // Add a timeout to the fetch to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout

    const response = await fetch("/api/news-context", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        content,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`Failed to fetch news context: ${response.status}`)

      // Provide a fallback based on the article title
      return `This article about "${title}" may benefit from additional context. While we couldn't generate specific background information at this moment, you can research more about this topic through reliable news sources.`
    }

    const data = await response.json()

    // Check if we got a valid context response
    if (!data.context || data.context.trim() === "") {
      return `This article titled "${title}" may require additional context. Consider checking multiple news sources to get a more complete understanding of this topic.`
    }

    return data.context
  } catch (error) {
    console.error("Error getting news context:", error)

    // Check if it's an abort error (timeout)
    if (error instanceof DOMException && error.name === "AbortError") {
      return "The request for additional context timed out. This might be due to high demand or temporary service limitations. Please try again in a few moments."
    }

    // Provide a more helpful fallback that includes the article title
    return `We couldn't retrieve additional context for "${title}" at this time. This might be due to temporary service limitations. You can still research this topic through other reliable news sources.`
  }
}

export async function getArticleContext(article: NewsArticle): Promise<AIContextResponse> {
  try {
    console.log("Getting AI context for article:", article.title)

    // Try to call the AI API
    const response = await fetch("/api/news-context", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: article.title,
        content: article.content || article.description,
        source: article.source?.name,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      return result
    } else {
      console.warn("AI API failed, using fallback analysis")
      return generateFallbackContext(article)
    }
  } catch (error) {
    console.error("Error getting article context:", error)
    return generateFallbackContext(article)
  }
}

export async function askQuestionAboutArticle(article: NewsArticle, question: string): Promise<string> {
  try {
    console.log("Asking question about article:", question)

    // Try to call the AI chat API
    const response = await fetch("/api/news-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        article: {
          title: article.title,
          content: article.content || article.description,
          source: article.source?.name,
        },
        question,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      return result.answer || "I couldn't process that question right now."
    } else {
      console.warn("AI chat API failed, using fallback response")
      return generateFallbackAnswer(article, question)
    }
  } catch (error) {
    console.error("Error asking question about article:", error)
    return generateFallbackAnswer(article, question)
  }
}

export async function askAIAboutArticle(
  title: string,
  description: string,
  content: string,
  question: string,
): Promise<string> {
  try {
    console.log("Asking AI about article:", title)
    console.log("Question:", question)

    // Add a timeout to the fetch to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout

    const response = await fetch("/api/news-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        content,
        question,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`Failed to get AI response: ${response.status}`)
      return `I couldn't analyze this article to answer your question at the moment. This might be due to temporary service limitations. You might want to try a different question or try again later.`
    }

    const data = await response.json()
    return (
      data.response ||
      "I couldn't generate a specific response to your question, but I can try to answer a different question about this article."
    )
  } catch (error) {
    console.error("Error getting AI response:", error)

    // Check if it's an abort error (timeout)
    if (error instanceof DOMException && error.name === "AbortError") {
      return "The request timed out while processing your question. This might be due to high demand or temporary service limitations. Please try again in a few moments."
    }

    return `I'm sorry, but I couldn't process your question about this article at this time. This might be due to temporary service limitations. Please try again later or ask a different question.`
  }
}

function generateFallbackContext(article: NewsArticle): AIContextResponse {
  console.log("Generating fallback context for:", article.title)

  const title = article.title.toLowerCase()
  const content = (article.content || article.description || "").toLowerCase()
  const text = `${title} ${content}`

  // Determine sentiment based on keywords
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
    "win",
    "victory",
    "progress",
  ]
  const negativeWords = [
    "crisis",
    "problem",
    "issue",
    "concern",
    "decline",
    "failure",
    "negative",
    "bad",
    "terrible",
    "loss",
    "defeat",
    "setback",
  ]

  const positiveCount = positiveWords.filter((word) => text.includes(word)).length
  const negativeCount = negativeWords.filter((word) => text.includes(word)).length

  let sentiment: "positive" | "negative" | "neutral" = "neutral"
  if (positiveCount > negativeCount) sentiment = "positive"
  else if (negativeCount > positiveCount) sentiment = "negative"

  // Extract topics based on common categories
  const topics: string[] = []
  if (text.includes("technology") || text.includes("ai") || text.includes("digital")) topics.push("Technology")
  if (text.includes("business") || text.includes("economy") || text.includes("market")) topics.push("Business")
  if (text.includes("health") || text.includes("medical") || text.includes("healthcare")) topics.push("Health")
  if (text.includes("politics") || text.includes("government") || text.includes("policy")) topics.push("Politics")
  if (text.includes("environment") || text.includes("climate") || text.includes("green")) topics.push("Environment")
  if (text.includes("sports") || text.includes("game") || text.includes("championship")) topics.push("Sports")
  if (text.includes("entertainment") || text.includes("movie") || text.includes("music")) topics.push("Entertainment")

  if (topics.length === 0) topics.push("General News")

  // Generate key points
  const sentences = (article.content || article.description || "").split(/[.!?]+/).filter((s) => s.trim().length > 20)
  const keyPoints = sentences
    .slice(0, 3)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  if (keyPoints.length === 0) {
    keyPoints.push("This article discusses recent developments in the news.")
  }

  // Generate credibility assessment
  const source = article.source?.name || "Unknown Source"
  const credibilityScore = article.credibilityScore || 75
  let credibilityAssessment = `This article from ${source} `

  if (credibilityScore >= 80) {
    credibilityAssessment += "appears to be from a reliable source with high credibility."
  } else if (credibilityScore >= 60) {
    credibilityAssessment += "comes from a moderately reliable source. Consider cross-referencing with other sources."
  } else {
    credibilityAssessment += "may require additional verification. Please check multiple sources for confirmation."
  }

  // Generate related questions
  const relatedQuestions = [
    "What are the main implications of this news?",
    "How might this affect the broader industry?",
    "What are the key facts to remember?",
    "Are there any potential concerns or criticisms?",
    "What might happen next in this story?",
  ]

  return {
    summary: `This article from ${source} discusses ${topics.join(", ").toLowerCase()} with a ${sentiment} outlook. ${keyPoints[0] || "The article provides important information on current events."}`,
    keyPoints,
    sentiment,
    topics,
    credibilityAssessment,
    relatedQuestions,
  }
}

function generateFallbackAnswer(article: NewsArticle, question: string): string {
  console.log("Generating fallback answer for question:", question)

  const lowerQuestion = question.toLowerCase()
  const title = article.title
  const content = article.content || article.description || ""
  const source = article.source?.name || "the source"

  // Handle common question patterns
  if (lowerQuestion.includes("what") && lowerQuestion.includes("about")) {
    return `This article discusses ${title.toLowerCase()}. According to ${source}, ${content.slice(0, 200)}...`
  }

  if (lowerQuestion.includes("when") || lowerQuestion.includes("time")) {
    const publishedDate = new Date(article.publishedAt).toLocaleDateString()
    return `This article was published on ${publishedDate}. The events described appear to be recent developments.`
  }

  if (lowerQuestion.includes("where") || lowerQuestion.includes("location")) {
    return `Based on the article content, this appears to involve multiple locations. The specific geographic details would need to be found in the full article text.`
  }

  if (lowerQuestion.includes("who") || lowerQuestion.includes("people")) {
    const author = article.author || "the reporter"
    return `This article was written by ${author} and published by ${source}. The article mentions various individuals involved in the story.`
  }

  if (lowerQuestion.includes("why") || lowerQuestion.includes("reason")) {
    return `The article explains the background and reasoning behind these developments. For detailed analysis of the causes, I'd recommend reading the full article.`
  }

  if (lowerQuestion.includes("how") || lowerQuestion.includes("process")) {
    return `The article outlines the process and methodology involved. The specific steps and procedures are detailed in the full article content.`
  }

  if (lowerQuestion.includes("impact") || lowerQuestion.includes("effect")) {
    return `This development could have significant implications for the industry and stakeholders involved. The long-term effects will likely become clearer over time.`
  }

  if (lowerQuestion.includes("opinion") || lowerQuestion.includes("think")) {
    return `Based on the article content, this appears to be a significant development. Different stakeholders may have varying perspectives on these events.`
  }

  if (lowerQuestion.includes("future") || lowerQuestion.includes("next")) {
    return `The article suggests that further developments are expected. Stakeholders will likely be monitoring the situation closely for updates.`
  }

  if (lowerQuestion.includes("source") || lowerQuestion.includes("reliable")) {
    const credibilityScore = article.credibilityScore || 75
    return `This article comes from ${source}. With a credibility score of ${credibilityScore}%, it appears to be ${credibilityScore >= 80 ? "highly reliable" : credibilityScore >= 60 ? "moderately reliable" : "requiring additional verification"}.`
  }

  // Default response
  return `That's an interesting question about "${title}". Based on the article from ${source}, this appears to be a developing story. I'd recommend reading the full article for more detailed information, as it may contain additional context that could help answer your question more thoroughly.`
}

export function extractKeywords(text: string): string[] {
  const commonWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "can",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "me",
    "him",
    "her",
    "us",
    "them",
    "my",
    "your",
    "his",
    "her",
    "its",
    "our",
    "their",
  ])

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !commonWords.has(word))
    .slice(0, 10)
}

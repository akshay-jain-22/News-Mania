// Simple fallback implementation without AI SDK dependencies
export interface NewsItem {
  id: string
  title: string
  description?: string
  content?: string
  url: string
  urlToImage?: string
  publishedAt: string
  source?: {
    name?: string
  }
  author?: string
  credibilityScore?: number
  isFactChecked?: boolean
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

    // Use fallback analysis for now to avoid AI SDK issues
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
  const title = article.title?.toLowerCase() || ""
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
    "win",
    "victory",
    "progress",
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
    "loss",
    "defeat",
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
    `This article discusses ${article.title}. Published by ${article.source?.name || "unknown source"}.`

  // Determine credibility based on source and other factors
  let credibility: "high" | "medium" | "low" = "medium"
  if (article.credibilityScore) {
    if (article.credibilityScore >= 80) credibility = "high"
    else if (article.credibilityScore < 60) credibility = "low"
  }

  return {
    summary,
    keyPoints: [
      `Article published by ${article.source?.name || "unknown source"}`,
      `Published on ${new Date(article.publishedAt).toLocaleDateString()}`,
      `Sentiment analysis shows ${sentiment} tone`,
      article.author ? `Written by ${article.author}` : "Author information not available",
    ].filter(Boolean),
    sentiment,
    credibility,
    bias: "center", // Default to center for fallback
    topics,
    relatedQuestions: [
      "What are the main facts in this article?",
      "Who are the key people or organizations mentioned?",
      "What is the significance of this news?",
      "How might this impact the broader industry or society?",
    ],
  }
}

// Helper function to extract topics from article
function extractFallbackTopics(article: NewsItem): string[] {
  const title = article.title?.toLowerCase() || ""
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
    return `This article was published by ${article.source?.name || "an unknown source"}${article.author ? ` and written by ${article.author}` : ""}. For specific people mentioned in the article, you would need to read the full content.`
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

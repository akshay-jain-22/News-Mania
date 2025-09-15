import { generateText } from "ai"
import { xai } from "@ai-sdk/xai"

interface NewsArticle {
  title: string
  description?: string
  content?: string
  source?: string
  url?: string
  publishedAt?: string
}

export async function getNewsContext(title: string, description: string, content: string): Promise<string> {
  try {
    const prompt = `
You are a news analysis expert. Provide helpful background context for this news article.

Article Details:
- Title: ${title}
- Description: ${description || "No description available"}
- Content Preview: ${content?.substring(0, 500) || "No content available"}

Please provide:
1. Background information about the main topic
2. Key context that readers should know
3. Related events or trends
4. Why this story matters
5. Any important background about organizations/people mentioned

Keep the response informative but concise (2-3 paragraphs).
`

    const { text } = await generateText({
      model: xai("grok-beta"),
      prompt,
      maxTokens: 300,
    })

    return text
  } catch (error) {
    console.error("Error generating AI context:", error)
    return generateSmartFallback({ title, description, content })
  }
}

export async function askAIAboutArticle(
  title: string,
  description: string,
  content: string,
  question: string,
): Promise<string> {
  try {
    const prompt = `
You are a helpful news assistant. Answer the user's question about this article.

Article Information:
- Title: ${title}
- Description: ${description || ""}
- Content: ${content?.substring(0, 1000) || "Limited content available"}

User Question: ${question}

Provide a helpful, accurate answer based on the article information. If the article doesn't contain enough information to answer the question, say so and suggest what additional information might be helpful.
`

    const { text } = await generateText({
      model: xai("grok-beta"),
      prompt,
      maxTokens: 200,
    })

    return text
  } catch (error) {
    console.error("Error generating chat response:", error)
    return generateChatFallback({ title, description, content }, question)
  }
}

export async function generateNewsInsight(article: NewsArticle, question: string): Promise<string> {
  return askAIAboutArticle(article.title, article.description || "", article.content || "", question)
}

function generateSmartFallback(article: NewsArticle): string {
  const title = article.title || "this article"
  const topics = detectTopics(article)
  const entities = extractEntities(article)

  let context = `This article covers `

  if (topics.length > 0) {
    context += `${topics.join(", ")} topics. `
  } else {
    context += `current news developments. `
  }

  if (entities.length > 0) {
    context += `Key entities mentioned include ${entities.slice(0, 3).join(", ")}. `
  }

  context += `For the most comprehensive understanding of this story, consider looking at related coverage from multiple news sources and checking for any recent updates or developments.`

  return context
}

function generateChatFallback(article: NewsArticle, question: string): string {
  const questionType = detectQuestionType(question)
  const title = article.title || "this article"

  switch (questionType) {
    case "what":
      return `Based on the article "${title}", this appears to be about ${extractMainTopic(article)}. For more specific details, you might want to read the full article or check additional sources.`

    case "when":
      if (article.publishedAt) {
        return `This article was published on ${new Date(article.publishedAt).toLocaleDateString()}. For specific timing of events mentioned in the article, please refer to the full text.`
      }
      return `The timing details would be found in the full article content. Please check the original source for specific dates and times.`

    case "who":
      const entities = extractEntities(article)
      if (entities.length > 0) {
        return `The article mentions ${entities.slice(0, 3).join(", ")}. For more details about the people or organizations involved, please read the full article.`
      }
      return `The article discusses various people and organizations. For specific details about who is involved, please refer to the full article content.`

    case "where":
      const locations = extractLocations(article)
      if (locations.length > 0) {
        return `This story appears to involve ${locations.join(", ")}. For more specific location details, please check the full article.`
      }
      return `Location details would be found in the full article. Please refer to the original source for specific geographic information.`

    case "why":
      return `The reasons and motivations behind this story are explained in the full article. For a complete understanding of the "why," I'd recommend reading the entire piece.`

    case "how":
      return `The process and methods are detailed in the full article. For step-by-step information about how this happened or works, please refer to the complete article content.`

    default:
      return `I'd be happy to help answer your question about "${title}". For the most accurate and detailed information, I recommend reading the full article from the original source.`
  }
}

function detectTopics(article: NewsArticle): string[] {
  const text = `${article.title} ${article.description} ${article.content}`.toLowerCase()
  const topics: string[] = []

  const topicKeywords = {
    technology: ["ai", "artificial intelligence", "tech", "software", "computer", "digital", "internet", "app"],
    politics: ["government", "election", "policy", "congress", "senate", "president", "political"],
    business: ["company", "business", "market", "stock", "economy", "financial", "revenue", "profit"],
    health: ["health", "medical", "doctor", "hospital", "disease", "treatment", "medicine"],
    sports: ["game", "team", "player", "sport", "championship", "league", "match"],
    science: ["research", "study", "scientist", "discovery", "experiment", "scientific"],
    entertainment: ["movie", "music", "celebrity", "entertainment", "film", "show", "actor"],
  }

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      topics.push(topic)
    }
  }

  return topics
}

function extractEntities(article: NewsArticle): string[] {
  const text = `${article.title} ${article.description}`.toLowerCase()
  const entities: string[] = []

  const fullText = `${article.title} ${article.description}`
  const orgPattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g
  const matches = fullText.match(orgPattern)

  if (matches) {
    entities.push(...matches.slice(0, 3))
  }

  return [...new Set(entities)]
}

function extractLocations(article: NewsArticle): string[] {
  const text = `${article.title} ${article.description}`.toLowerCase()
  const locations: string[] = []

  const locationKeywords = [
    "united states",
    "usa",
    "america",
    "china",
    "russia",
    "europe",
    "asia",
    "new york",
    "california",
    "texas",
    "florida",
    "washington",
    "london",
    "paris",
  ]

  locationKeywords.forEach((location) => {
    if (text.includes(location)) {
      locations.push(location)
    }
  })

  return locations
}

function extractMainTopic(article: NewsArticle): string {
  const topics = detectTopics(article)
  if (topics.length > 0) {
    return topics[0]
  }

  const title = article.title?.toLowerCase() || ""
  if (title.includes("break") || title.includes("news")) {
    return "breaking news"
  }

  return "current events"
}

function detectQuestionType(question: string): string {
  const q = question.toLowerCase()
  if (q.startsWith("what")) return "what"
  if (q.startsWith("when")) return "when"
  if (q.startsWith("who")) return "who"
  if (q.startsWith("where")) return "where"
  if (q.startsWith("why")) return "why"
  if (q.startsWith("how")) return "how"
  return "general"
}

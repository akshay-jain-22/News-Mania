/**
 * Get additional context for a news article using AI
 */
export async function getNewsContext(title: string, description: string, content: string): Promise<string> {
  try {
    console.log("Requesting context for article:", title)

    // Add a timeout to the fetch to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

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
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()

    // Check if we got a valid context response
    if (!data.context || data.context.trim() === "") {
      throw new Error("Empty context received")
    }

    return data.context
  } catch (error) {
    console.error("Error getting news context:", error)

    // Create intelligent fallback based on article content
    return createIntelligentFallback(title, description, content)
  }
}

/**
 * Ask AI a question about a specific news article
 */
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
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

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
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.response || data.response.trim() === "") {
      throw new Error("Empty response received")
    }

    return data.response
  } catch (error) {
    console.error("Error getting AI response:", error)

    // Create intelligent response based on the question and article
    return createIntelligentResponse(title, description, content, question)
  }
}

/**
 * Create an intelligent fallback context based on article content
 */
function createIntelligentFallback(title: string, description: string, content: string): string {
  const articleText = (title + " " + description + " " + content).toLowerCase()

  // Extract key topics and entities
  const topics = extractTopics(articleText)
  const entities = extractEntities(articleText)

  let context = `Here's additional context about "${title}":\n\n`

  // Add topic-based context
  if (topics.length > 0) {
    context += `📋 Key Topics: This article covers ${topics.join(", ")}.\n\n`
  }

  // Add entity-based context
  if (entities.length > 0) {
    context += `🏢 Key Entities: The story involves ${entities.join(", ")}.\n\n`
  }

  // Add general context based on content analysis
  if (articleText.includes("breaking") || articleText.includes("urgent")) {
    context += `⚡ Breaking News: This appears to be a developing story that may have ongoing updates.\n\n`
  }

  if (articleText.includes("study") || articleText.includes("research")) {
    context += `🔬 Research-Based: This article references scientific studies or research findings.\n\n`
  }

  if (articleText.includes("government") || articleText.includes("policy")) {
    context += `🏛️ Government/Policy: This story involves government actions or policy decisions.\n\n`
  }

  if (articleText.includes("market") || articleText.includes("stock") || articleText.includes("economy")) {
    context += `📈 Economic Impact: This news may have economic or market implications.\n\n`
  }

  context += `💡 For More Information: Consider checking multiple reliable news sources for comprehensive coverage of this topic. You can also ask specific questions about this article using the chat feature.`

  return context
}

/**
 * Create an intelligent response based on the question and article content
 */
function createIntelligentResponse(title: string, description: string, content: string, question: string): string {
  const articleText = (title + " " + description + " " + content).toLowerCase()
  const questionLower = question.toLowerCase()

  // Question type detection and response generation
  if (questionLower.includes("what") && questionLower.includes("about")) {
    return `Based on the article "${title}", this story discusses ${description || "the topic mentioned in the headline"}. ${content ? "The article provides details about " + content.substring(0, 200) + "..." : "For complete details, I recommend reading the full article."}`
  }

  if (questionLower.includes("when") || questionLower.includes("time")) {
    const timeInfo = extractTimeInfo(articleText)
    return timeInfo
      ? `According to the article, ${timeInfo}`
      : `The article doesn't specify exact timing, but you can find more details in the full article about "${title}".`
  }

  if (questionLower.includes("who")) {
    const people = extractPeople(articleText)
    return people.length > 0
      ? `The article mentions several key people: ${people.join(", ")}. For more details about their roles, please refer to the full article.`
      : `The article "${title}" discusses various parties, but specific individuals aren't clearly identified in the available excerpt.`
  }

  if (questionLower.includes("where")) {
    const locations = extractLocations(articleText)
    return locations.length > 0
      ? `This story takes place in or involves: ${locations.join(", ")}. The full article may contain more specific location details.`
      : `The article doesn't specify clear locations in the available excerpt. Check the full article for geographic details.`
  }

  if (questionLower.includes("why") || questionLower.includes("reason")) {
    return `The article "${title}" explains the reasoning behind this story. ${description || "The main points are covered in the article content."} For a complete understanding of the motivations and reasons, I recommend reading the full article.`
  }

  if (questionLower.includes("how")) {
    return `The article provides details on how this situation developed. ${content ? "According to the content: " + content.substring(0, 200) + "..." : "The full article contains the step-by-step details."}`
  }

  // Default intelligent response
  return `That's an interesting question about "${title}". While I can see this article covers ${description || "the topic in the headline"}, I'd recommend reading the full article for the most accurate and complete information. You can also try asking more specific questions about particular aspects of the story.`
}

/**
 * Extract topics from article text
 */
function extractTopics(text: string): string[] {
  const topicKeywords = {
    technology: ["tech", "ai", "artificial intelligence", "software", "app", "digital", "cyber", "internet"],
    politics: ["government", "election", "vote", "policy", "congress", "senate", "president"],
    business: ["company", "business", "market", "stock", "economy", "financial", "revenue", "profit"],
    health: ["health", "medical", "doctor", "hospital", "disease", "treatment", "vaccine"],
    sports: ["game", "team", "player", "sport", "championship", "league", "match"],
    science: ["research", "study", "scientist", "discovery", "experiment", "data"],
  }

  const foundTopics: string[] = []

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      foundTopics.push(topic)
    }
  }

  return foundTopics
}

/**
 * Extract entities (companies, organizations) from text
 */
function extractEntities(text: string): string[] {
  const commonEntities = [
    "apple",
    "google",
    "microsoft",
    "amazon",
    "facebook",
    "meta",
    "twitter",
    "tesla",
    "nasa",
    "fda",
    "cdc",
    "who",
    "un",
    "eu",
    "nato",
    "congress",
    "senate",
    "white house",
    "supreme court",
  ]

  return commonEntities.filter((entity) => text.includes(entity))
}

/**
 * Extract time-related information
 */
function extractTimeInfo(text: string): string | null {
  const timePatterns = [
    /(\d{1,2}:\d{2})/g,
    /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
    /(january|february|march|april|may|june|july|august|september|october|november|december)/gi,
    /(today|tomorrow|yesterday|next week|last week)/gi,
  ]

  for (const pattern of timePatterns) {
    const match = text.match(pattern)
    if (match) {
      return `the timing mentioned includes ${match[0]}`
    }
  }

  return null
}

/**
 * Extract people names (basic pattern matching)
 */
function extractPeople(text: string): string[] {
  // This is a simplified approach - in a real app you'd use NLP
  const words = text.split(" ")
  const people: string[] = []

  for (let i = 0; i < words.length - 1; i++) {
    const word = words[i]
    const nextWord = words[i + 1]

    // Look for capitalized words that might be names
    if (word.match(/^[A-Z][a-z]+$/) && nextWord.match(/^[A-Z][a-z]+$/)) {
      people.push(`${word} ${nextWord}`)
    }
  }

  return people.slice(0, 3) // Return max 3 names
}

/**
 * Extract locations (basic pattern matching)
 */
function extractLocations(text: string): string[] {
  const commonLocations = [
    "new york",
    "california",
    "texas",
    "florida",
    "washington",
    "london",
    "paris",
    "tokyo",
    "china",
    "usa",
    "america",
    "europe",
    "asia",
    "africa",
    "australia",
  ]

  return commonLocations.filter((location) => text.includes(location))
}

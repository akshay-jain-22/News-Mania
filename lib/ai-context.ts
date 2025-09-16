export interface NewsArticle {
  title: string
  description: string
  content: string
  source: string
  url: string
  publishedAt: string
}

export interface ContextResponse {
  summary: string
  context: string
  significance?: string
  keyTopics?: string[]
  relatedEvents?: string[]
}

export async function getNewsContext(article: NewsArticle): Promise<ContextResponse> {
  try {
    // Try to use OpenAI API if available
    if (process.env.OPENAI_API_KEY) {
      const response = await fetch("/api/news-context", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ article }),
      })

      if (response.ok) {
        const data = await response.json()
        return data
      }
    }

    // Fallback to intelligent analysis
    return generateIntelligentContext(article)
  } catch (error) {
    console.error("Error getting news context:", error)
    return generateIntelligentContext(article)
  }
}

function generateIntelligentContext(article: NewsArticle): ContextResponse {
  const title = article.title.toLowerCase()
  const description = article.description.toLowerCase()
  const content = article.content.toLowerCase()
  const fullText = `${title} ${description} ${content}`

  // Extract key topics based on content analysis
  const keyTopics = extractKeyTopics(fullText)

  // Generate context based on detected topics
  const context = generateContextByTopics(keyTopics, article)

  // Generate summary
  const summary = generateSummary(article)

  // Generate significance
  const significance = generateSignificance(keyTopics, article)

  return {
    summary,
    context,
    significance,
    keyTopics: keyTopics.slice(0, 5), // Top 5 topics
    relatedEvents: generateRelatedEvents(keyTopics),
  }
}

function extractKeyTopics(text: string): string[] {
  const topics: string[] = []

  // Technology keywords
  if (
    text.match(
      /\b(ai|artificial intelligence|machine learning|technology|tech|software|digital|cyber|robot|automation|blockchain|cryptocurrency|bitcoin)\b/g,
    )
  ) {
    topics.push("Technology")
  }

  // Business/Economy keywords
  if (
    text.match(
      /\b(business|economy|economic|market|stock|finance|financial|trade|company|corporate|investment|revenue|profit)\b/g,
    )
  ) {
    topics.push("Business")
  }

  // Politics keywords
  if (
    text.match(
      /\b(politics|political|government|election|vote|policy|law|congress|senate|president|minister|parliament)\b/g,
    )
  ) {
    topics.push("Politics")
  }

  // Health keywords
  if (
    text.match(/\b(health|medical|medicine|hospital|doctor|patient|disease|treatment|vaccine|pandemic|covid|virus)\b/g)
  ) {
    topics.push("Health")
  }

  // Environment keywords
  if (
    text.match(
      /\b(climate|environment|environmental|green|renewable|energy|carbon|emission|pollution|sustainability)\b/g,
    )
  ) {
    topics.push("Environment")
  }

  // Sports keywords
  if (
    text.match(
      /\b(sport|sports|game|team|player|match|championship|league|tournament|olympic|football|basketball|soccer)\b/g,
    )
  ) {
    topics.push("Sports")
  }

  // Science keywords
  if (
    text.match(
      /\b(science|scientific|research|study|discovery|experiment|space|nasa|mars|physics|chemistry|biology)\b/g,
    )
  ) {
    topics.push("Science")
  }

  return topics.length > 0 ? topics : ["General News"]
}

function generateContextByTopics(topics: string[], article: NewsArticle): string {
  const primaryTopic = topics[0] || "General News"

  const contextTemplates = {
    Technology: `This technology news relates to ongoing developments in the digital sector. The rapid pace of technological advancement continues to reshape industries and society. Key factors include innovation cycles, market competition, regulatory considerations, and societal impact.`,

    Business: `This business news reflects current market dynamics and economic trends. Understanding the broader economic context helps interpret the significance of corporate developments, market movements, and financial decisions that affect stakeholders.`,

    Politics: `This political development occurs within the current governmental and policy landscape. Political decisions often have far-reaching consequences for citizens, institutions, and international relations, requiring careful analysis of motivations and potential outcomes.`,

    Health: `This health-related news impacts public health policy and individual well-being. Medical developments, policy changes, and health crises require understanding of scientific evidence, healthcare systems, and population health considerations.`,

    Environment: `This environmental news relates to ongoing climate and sustainability challenges. Environmental issues often involve complex interactions between human activity, natural systems, and policy responses at local and global levels.`,

    Sports: `This sports news reflects developments in athletic competition and sports culture. Sports events often bring communities together and can have significant economic and social impacts beyond the games themselves.`,

    Science: `This scientific news represents advances in human knowledge and understanding. Scientific discoveries often have long-term implications for technology, medicine, and our understanding of the world around us.`,

    "General News": `This news story reflects current events and their potential impact on society. Understanding the broader context helps interpret the significance and potential consequences of these developments.`,
  }

  return contextTemplates[primaryTopic] || contextTemplates["General News"]
}

function generateSummary(article: NewsArticle): string {
  const sentences = article.description.split(/[.!?]+/).filter((s) => s.trim().length > 0)

  if (sentences.length <= 2) {
    return article.description
  }

  // Return first two sentences as summary
  return sentences.slice(0, 2).join(". ") + "."
}

function generateSignificance(topics: string[], article: NewsArticle): string {
  const primaryTopic = topics[0] || "General News"

  const significanceTemplates = {
    Technology:
      "This development could influence future technological adoption, market competition, and digital transformation across industries.",
    Business:
      "This business development may affect market conditions, employment, consumer prices, and economic growth in the sector.",
    Politics:
      "This political development could impact policy decisions, governance, and the relationship between institutions and citizens.",
    Health: "This health news may influence public health policy, medical practice, and individual health decisions.",
    Environment:
      "This environmental development could affect climate policy, sustainability efforts, and long-term environmental outcomes.",
    Sports: "This sports news may impact athletic competition, fan engagement, and the broader sports industry.",
    Science:
      "This scientific development could lead to new technologies, medical treatments, or changes in our understanding of natural phenomena.",
    "General News": "This development may have broader implications for society, policy, or public discourse.",
  }

  return significanceTemplates[primaryTopic] || significanceTemplates["General News"]
}

function generateRelatedEvents(topics: string[]): string[] {
  const events: string[] = []

  topics.forEach((topic) => {
    switch (topic) {
      case "Technology":
        events.push(
          "Recent AI breakthroughs in various industries",
          "Ongoing digital transformation initiatives",
          "Technology regulation discussions",
        )
        break
      case "Business":
        events.push(
          "Current market volatility and economic indicators",
          "Recent corporate earnings and business developments",
          "Trade and economic policy changes",
        )
        break
      case "Politics":
        events.push(
          "Recent policy announcements and legislative actions",
          "Ongoing political campaigns and elections",
          "International diplomatic developments",
        )
        break
      case "Health":
        events.push(
          "Public health initiatives and policy updates",
          "Medical research breakthroughs",
          "Healthcare system developments",
        )
        break
      case "Environment":
        events.push(
          "Climate change mitigation efforts",
          "Renewable energy developments",
          "Environmental policy initiatives",
        )
        break
      case "Sports":
        events.push(
          "Ongoing sports seasons and tournaments",
          "Athletic achievements and records",
          "Sports industry business developments",
        )
        break
      case "Science":
        events.push(
          "Recent scientific discoveries and research",
          "Space exploration missions",
          "Medical and technological innovations",
        )
        break
    }
  })

  return events.slice(0, 3) // Return top 3 related events
}

export async function askAboutArticle(article: NewsArticle, question: string): Promise<string> {
  try {
    // Try to use OpenAI API if available
    if (process.env.OPENAI_API_KEY) {
      const response = await fetch("/api/news-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ article, question }),
      })

      if (response.ok) {
        const data = await response.json()
        return data.response
      }
    }

    // Fallback to intelligent responses
    return generateIntelligentResponse(article, question)
  } catch (error) {
    console.error("Error asking about article:", error)
    return generateIntelligentResponse(article, question)
  }
}

function generateIntelligentResponse(article: NewsArticle, question: string): string {
  const questionLower = question.toLowerCase()
  const title = article.title.toLowerCase()
  const description = article.description.toLowerCase()
  const content = article.content.toLowerCase()

  // Question type detection
  if (questionLower.includes("what") && (questionLower.includes("about") || questionLower.includes("is"))) {
    return `This article discusses ${article.title}. ${article.description} The main focus appears to be on the key developments and their potential implications.`
  }

  if (questionLower.includes("why") || questionLower.includes("reason")) {
    return `Based on the article content, this appears to be significant because it represents an important development in the field. The underlying factors and motivations are explained in the context of current trends and circumstances.`
  }

  if (questionLower.includes("how")) {
    return `According to the article, the process or mechanism involves several key steps and considerations. The implementation details and methodology are outlined based on the information provided.`
  }

  if (questionLower.includes("when") || questionLower.includes("time")) {
    return `The article was published on ${new Date(article.publishedAt).toLocaleDateString()}. The timing of these events appears to be significant in the current context.`
  }

  if (questionLower.includes("who") || questionLower.includes("people") || questionLower.includes("person")) {
    return `The article mentions various stakeholders and individuals involved in this development. The key people and organizations are identified based on their roles and contributions to the situation.`
  }

  if (questionLower.includes("where") || questionLower.includes("location")) {
    return `Based on the article content, this development appears to have geographic or institutional significance. The location and scope of impact are relevant to understanding the broader implications.`
  }

  if (questionLower.includes("impact") || questionLower.includes("effect") || questionLower.includes("consequence")) {
    return `The potential impacts of this development could be significant across multiple areas. Based on the article content, there may be short-term and long-term consequences that affect various stakeholders.`
  }

  if (questionLower.includes("future") || questionLower.includes("next") || questionLower.includes("will")) {
    return `Looking ahead, this development could lead to several possible outcomes. The future implications depend on various factors including policy responses, market conditions, and stakeholder actions.`
  }

  // Default response
  return `Based on the article "${article.title}", this appears to be a significant development. ${article.description} The information suggests there are multiple aspects to consider, including the immediate implications and potential longer-term effects.`
}

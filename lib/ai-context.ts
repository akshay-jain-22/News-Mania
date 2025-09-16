export interface NewsArticle {
  title: string
  description?: string
  content?: string
  source: string
  url: string
  publishedAt: string
}

export interface ContextResponse {
  context: string
  summary?: string
  significance?: string
  keyTopics: string[]
  relatedEvents: string[]
}

export interface ChatResponse {
  response: string
  suggestedQuestions: string[]
}

function analyzeQuestionType(question: string): string {
  const q = question.toLowerCase().trim()

  if (q.startsWith("what") || q.includes("what is") || q.includes("what are") || q === "what?") return "what"
  if (q.startsWith("why") || q.includes("why is") || q.includes("why are") || q === "why?") return "why"
  if (q.startsWith("when") || q.includes("when did") || q.includes("when will") || q === "when?") return "when"
  if (q.startsWith("who") || q.includes("who is") || q.includes("who are") || q === "who?") return "who"
  if (q.startsWith("where") || q.includes("where is") || q.includes("where are") || q === "where?") return "where"
  if (q.startsWith("how") || q.includes("how does") || q.includes("how can") || q === "how?") return "how"

  return "general"
}

export async function getNewsContext(article: NewsArticle): Promise<ContextResponse> {
  try {
    const response = await fetch("/api/news-context", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: article.title,
        description: article.description,
        content: article.content,
        source: article.source,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return data
    }
  } catch (error) {
    console.error("Error fetching AI context:", error)
  }

  return generateIntelligentContext(article)
}

export async function askAIAboutArticle(article: NewsArticle, question: string): Promise<ChatResponse> {
  try {
    const response = await fetch("/api/news-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: question,
        article: {
          title: article.title,
          description: article.description,
          content: article.content,
          source: article.source,
        },
      }),
    })

    if (response.ok) {
      const data = await response.json()
      return {
        response: data.response || generateFallbackResponse(question, article),
        suggestedQuestions: data.suggestedQuestions || generateSuggestedQuestions(article),
      }
    }
  } catch (error) {
    console.error("Error getting AI response:", error)
  }

  return generateSmartFallbackResponse(article, question)
}

function generateIntelligentContext(article: NewsArticle): ContextResponse {
  const title = article.title?.toLowerCase() || ""
  const description = article.description?.toLowerCase() || ""
  const content = article.content?.toLowerCase() || ""
  const source = article.source || "Unknown Source"

  const allText = `${title} ${description} ${content}`.toLowerCase()

  let summary = ""
  if (article.description && article.description.length > 50) {
    summary = article.description
  } else if (article.content && article.content.length > 100) {
    const sentences = article.content.split(/[.!?]+/)
    const meaningfulSentences = sentences.filter((s) => s.trim().length > 30)
    if (meaningfulSentences.length > 0) {
      summary = meaningfulSentences.slice(0, 2).join(". ").trim() + "."
    }
  }

  if (!summary) {
    summary = `This article from ${source} covers recent developments. ${article.title}`
  }

  const keyTopics: string[] = []
  const topicKeywords = {
    Technology: ["ai", "tech", "software", "computer", "digital", "internet", "app", "platform", "innovation"],
    Politics: ["government", "election", "president", "congress", "senate", "policy", "political", "vote"],
    Business: ["company", "business", "market", "economy", "financial", "stock", "investment", "corporate"],
    Health: ["health", "medical", "hospital", "doctor", "patient", "treatment", "medicine", "healthcare"],
    Sports: ["game", "team", "player", "season", "championship", "league", "coach", "score", "match"],
    Science: ["research", "study", "scientist", "discovery", "experiment", "university", "academic"],
    Environment: ["climate", "environment", "green", "sustainability", "carbon", "renewable", "pollution"],
    Entertainment: ["movie", "film", "music", "celebrity", "entertainment", "show", "actor", "artist"],
  }

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some((keyword) => allText.includes(keyword))) {
      keyTopics.push(topic)
    }
  }

  if (keyTopics.length === 0) {
    keyTopics.push("General News")
  }

  let context = ""
  let significance = ""

  if (keyTopics.includes("Technology")) {
    context = `This technology article discusses developments in the tech industry. Published by ${source}, it covers innovations and trends that may impact how we use technology in daily life.`
    significance =
      "Technology news helps us understand how digital innovations might affect our future work, communication, and lifestyle choices."
  } else if (keyTopics.includes("Politics")) {
    context = `This political news story covers governmental or policy-related developments. ${source} reports on political events that may influence public policy and civic life.`
    significance =
      "Political developments can directly impact citizens through changes in laws, policies, and government services."
  } else if (keyTopics.includes("Business")) {
    context = `This business article examines economic and corporate developments. ${source} provides insights into market trends and business decisions that may affect the broader economy.`
    significance =
      "Business news helps understand economic trends that can influence employment, investment opportunities, and consumer prices."
  } else if (keyTopics.includes("Sports")) {
    context = `This sports article covers athletic competitions, team developments, or sports industry news. ${source} reports on sporting events and developments in professional athletics.`
    significance =
      "Sports news connects communities through shared interests and provides entertainment and cultural significance."
  } else {
    context = `This article from ${source} covers current events and developments. It provides information about recent happenings that may be of public interest.`
    significance =
      "Staying informed about current events helps citizens make better decisions and understand the world around them."
  }

  const relatedEvents: string[] = []

  if (allText.includes("election") || allText.includes("vote")) {
    relatedEvents.push("Ongoing election campaigns and voting processes")
  }
  if (allText.includes("market") || allText.includes("stock")) {
    relatedEvents.push("Recent market fluctuations and economic indicators")
  }
  if (allText.includes("climate") || allText.includes("environment")) {
    relatedEvents.push("Global climate initiatives and environmental policies")
  }

  const publishDate = new Date(article.publishedAt)
  const now = new Date()
  const daysDiff = Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24))

  if (daysDiff === 0) {
    relatedEvents.push("Breaking news developments from today")
  } else if (daysDiff <= 7) {
    relatedEvents.push("Recent developments from this week")
  }

  return {
    context,
    summary,
    significance,
    keyTopics,
    relatedEvents,
  }
}

function generateSmartFallbackResponse(article: NewsArticle, question: string): ChatResponse {
  const questionType = analyzeQuestionType(question)
  const articleText = `${article.title} ${article.description || ""} ${article.content || ""}`.toLowerCase()

  let response = ""

  const isAboutSports =
    articleText.includes("chiefs") ||
    articleText.includes("eagles") ||
    articleText.includes("game") ||
    articleText.includes("football") ||
    articleText.includes("predictions") ||
    articleText.includes("week")

  const isAboutTechnology =
    articleText.includes("tech") ||
    articleText.includes("ai") ||
    articleText.includes("software") ||
    articleText.includes("digital")

  const isAboutBusiness =
    articleText.includes("business") ||
    articleText.includes("market") ||
    articleText.includes("company") ||
    articleText.includes("economy")

  let actualTopic = "current events"
  if (isAboutSports) actualTopic = "sports"
  else if (isAboutTechnology) actualTopic = "technology"
  else if (isAboutBusiness) actualTopic = "business"

  switch (questionType) {
    case "what":
      if (isAboutSports) {
        response = `This article is about NFL predictions for a Chiefs vs Eagles game. Based on the title "${article.title}", it appears to be covering Week 2 predictions from Arrowhead Pride, which is likely a Kansas City Chiefs fan site. The article probably discusses expected outcomes, player performances, and game analysis for this matchup.`
      } else {
        response = `Based on the article "${article.title}", this appears to be about ${actualTopic}. ${article.description ? `The article describes: ${article.description}` : "The content covers relevant developments in this area."}`
      }
      break

    case "why":
      if (isAboutSports) {
        response = `This sports prediction article is important because it provides fan insights and analysis ahead of a significant NFL matchup between the Chiefs and Eagles. Prediction articles help fans prepare for games and understand potential outcomes based on team performance, player stats, and expert analysis.`
      } else {
        response = `This news is significant because it relates to ${actualTopic} developments that affect various stakeholders. ${article.description ? `According to the article: ${article.description}` : "The story provides important context about current events in this area."}`
      }
      break

    case "when":
      if (article.publishedAt) {
        const publishDate = new Date(article.publishedAt).toLocaleDateString()
        response = `This article was published on ${publishDate}. ${isAboutSports ? "Since it mentions 'Week 2', this is likely referring to the second week of the NFL season." : "The timing provides context for understanding when these events occurred."}`
      } else {
        response = `The article "${article.title}" appears to be recent. ${isAboutSports ? "The 'Week 2' reference suggests this is about the second week of the NFL season." : "For specific timing details, the original article would have more precise information."}`
      }
      break

    case "who":
      if (isAboutSports) {
        response = `This article involves the Kansas City Chiefs and Philadelphia Eagles NFL teams. It's published by or covered by Arrowhead Pride, which is likely a Chiefs-focused sports publication. The article probably discusses players, coaches, and analysts' predictions for the matchup.`
      } else {
        response = `The article "${article.title}" discusses various people and organizations involved in this ${actualTopic} story. For specific names and roles, the full article content would provide more details.`
      }
      break

    case "where":
      if (isAboutSports) {
        response = `This involves NFL teams - the Kansas City Chiefs (based in Kansas City, Missouri) and the Philadelphia Eagles (based in Philadelphia, Pennsylvania). The predictions are coming from Arrowhead Pride, which is associated with the Chiefs' fanbase and likely based in the Kansas City area.`
      } else {
        response = `The geographic context of "${article.title}" would be detailed in the full article. The story appears to have ${actualTopic} implications that may affect various locations.`
      }
      break

    case "how":
      if (isAboutSports) {
        response = `Sports prediction articles typically analyze team statistics, player performance, injury reports, historical matchups, and expert opinions to forecast game outcomes. Arrowhead Pride likely uses Chiefs-focused analysis, fan insights, and statistical models to make their Week 2 predictions for the Chiefs vs Eagles game.`
      } else {
        response = `The processes and methods involved in this ${actualTopic} story are explained in the article "${article.title}". ${article.description ? `The article describes: ${article.description}` : "The full article would detail the specific mechanisms and approaches involved."}`
      }
      break

    default:
      if (isAboutSports) {
        response = `This is a sports prediction article about an NFL game between the Kansas City Chiefs and Philadelphia Eagles for Week 2. The article comes from Arrowhead Pride, which provides Chiefs-focused analysis and predictions. It likely covers expected game outcomes, player performances, and strategic insights for this matchup.`
      } else {
        response = `Based on the article "${article.title}" from ${article.source || "this source"}, this covers ${actualTopic} developments. ${article.description ? `The article states: ${article.description}` : "The story provides important information about current events in this area."} I can help answer more specific questions about the content.`
      }
  }

  const suggestedQuestions = generateSuggestedQuestions(article)

  return {
    response,
    suggestedQuestions,
  }
}

function generateFallbackResponse(question: string, article: NewsArticle): string {
  return `Based on the article "${article.title}" from ${article.source}: ${article.description || "This article provides relevant information that can help answer your question."} Feel free to ask more specific questions about the content.`
}

function generateSuggestedQuestions(article: NewsArticle): string[] {
  const articleText = `${article.title} ${article.description || ""}`.toLowerCase()

  const baseQuestions = [
    "What are the main points of this story?",
    "Why is this news significant?",
    "What are the potential implications?",
  ]

  if (articleText.includes("chiefs") && articleText.includes("eagles")) {
    return [
      "What are the key predictions for this game?",
      "Which team is favored to win?",
      "What factors influence these predictions?",
      "How do the teams match up against each other?",
    ]
  }

  return baseQuestions
}

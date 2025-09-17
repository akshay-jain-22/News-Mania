import type { NewsArticle, UserCredentials } from "@/types/user-profile"

/**
 * Mathematical Model 1: News Classification System
 * Uses TF-IDF, location scoring, and category classification
 */

export class NewsClassifier {
  private categoryKeywords: Record<string, string[]> = {
    politics: ["government", "election", "policy", "congress", "senate", "president", "minister", "parliament"],
    business: ["market", "economy", "stock", "finance", "company", "revenue", "profit", "investment"],
    technology: ["tech", "ai", "software", "digital", "innovation", "startup", "algorithm", "data"],
    sports: ["game", "team", "player", "championship", "league", "match", "tournament", "score"],
    entertainment: ["movie", "music", "celebrity", "film", "show", "actor", "artist", "entertainment"],
    health: ["health", "medical", "doctor", "hospital", "disease", "treatment", "medicine", "wellness"],
    science: ["research", "study", "scientist", "discovery", "experiment", "university", "academic"],
    environment: ["climate", "environment", "green", "pollution", "sustainability", "renewable", "carbon"],
  }

  private locationKeywords: Record<string, string[]> = {
    local: ["city", "town", "local", "community", "neighborhood", "municipal"],
    national: ["country", "national", "federal", "state", "nationwide"],
    international: ["global", "international", "worldwide", "foreign", "overseas"],
  }

  /**
   * TF-IDF based category classification
   * Formula: TF(t,d) * IDF(t) where TF = (term frequency in document) / (total terms in document)
   * IDF = log(total documents / documents containing term)
   */
  classifyCategory(article: NewsArticle): { category: string; confidence: number; scores: Record<string, number> } {
    const text = `${article.title} ${article.description} ${article.content}`.toLowerCase()
    const words = this.tokenize(text)
    const wordFreq = this.calculateTermFrequency(words)

    const categoryScores: Record<string, number> = {}

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      let score = 0
      let matchCount = 0

      for (const keyword of keywords) {
        const tf = wordFreq[keyword] || 0
        if (tf > 0) {
          // Simple IDF approximation (in production, calculate from corpus)
          const idf = Math.log(1000 / (keywords.length * 10))
          score += tf * idf
          matchCount++
        }
      }

      // Normalize by keyword count and add position weighting
      const titleBoost = this.getTitleBoost(article.title.toLowerCase(), keywords)
      categoryScores[category] = score / keywords.length + titleBoost + matchCount * 0.1
    }

    const maxCategory = Object.entries(categoryScores).reduce((a, b) =>
      categoryScores[a[0]] > categoryScores[b[0]] ? a : b,
    )

    const totalScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0)
    const confidence = totalScore > 0 ? categoryScores[maxCategory[0]] / totalScore : 0

    return {
      category: maxCategory[0],
      confidence: Math.min(confidence, 1),
      scores: categoryScores,
    }
  }

  /**
   * Location relevance scoring using geographic and contextual factors
   * Formula: LocationScore = (GeographicProximity * 0.4) + (ContextualRelevance * 0.6)
   */
  calculateLocationRelevance(article: NewsArticle, userLocation: UserCredentials["location"]): number {
    let score = 0

    // Geographic proximity scoring
    if (article.location_relevance.country === userLocation.country) {
      score += 0.3

      if (article.location_relevance.state === userLocation.state) {
        score += 0.2

        if (article.location_relevance.city === userLocation.city) {
          score += 0.3
        }
      }
    }

    // Global relevance factor
    score += article.location_relevance.global_relevance * 0.2

    // Contextual relevance from content
    const text = `${article.title} ${article.description}`.toLowerCase()
    const locationMentions = [
      userLocation.city.toLowerCase(),
      userLocation.state.toLowerCase(),
      userLocation.country.toLowerCase(),
    ].filter((loc) => text.includes(loc)).length

    score += Math.min(locationMentions * 0.1, 0.3)

    return Math.min(score, 1)
  }

  /**
   * Content complexity scoring using readability metrics
   * Uses Flesch Reading Ease approximation
   */
  calculateComplexityScore(article: NewsArticle): number {
    const text = article.content || article.description
    const sentences = text.split(/[.!?]+/).length
    const words = text.split(/\s+/).length
    const syllables = this.estimateSyllables(text)

    if (sentences === 0 || words === 0) return 0.5

    // Flesch Reading Ease formula approximation
    const avgWordsPerSentence = words / sentences
    const avgSyllablesPerWord = syllables / words

    const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord

    // Convert to 0-1 scale (higher = more complex)
    return Math.max(0, Math.min(1, (100 - fleschScore) / 100))
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
  }

  private calculateTermFrequency(words: string[]): Record<string, number> {
    const freq: Record<string, number> = {}
    const totalWords = words.length

    for (const word of words) {
      freq[word] = (freq[word] || 0) + 1
    }

    // Normalize by total word count
    for (const word in freq) {
      freq[word] = freq[word] / totalWords
    }

    return freq
  }

  private getTitleBoost(title: string, keywords: string[]): number {
    let boost = 0
    for (const keyword of keywords) {
      if (title.includes(keyword)) {
        boost += 0.2 // Title matches are more important
      }
    }
    return Math.min(boost, 0.5)
  }

  private estimateSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/)
    let syllableCount = 0

    for (const word of words) {
      // Simple syllable estimation
      const vowelMatches = word.match(/[aeiouy]+/g)
      let syllables = vowelMatches ? vowelMatches.length : 1

      // Adjust for silent e
      if (word.endsWith("e")) syllables--

      syllableCount += Math.max(1, syllables)
    }

    return syllableCount
  }
}

export const newsClassifier = new NewsClassifier()

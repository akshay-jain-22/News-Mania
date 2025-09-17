import type { NewsArticle } from "@/types/user-profile"

export class NewsClassifier {
  private categoryKeywords: Record<string, string[]> = {
    politics: ["government", "election", "policy", "parliament", "congress", "senate", "minister", "president"],
    sports: ["football", "basketball", "soccer", "tennis", "olympics", "championship", "league", "match"],
    entertainment: ["movie", "music", "celebrity", "hollywood", "concert", "album", "film", "actor"],
    business: ["market", "stock", "economy", "finance", "company", "revenue", "profit", "investment"],
    technology: ["ai", "software", "tech", "digital", "innovation", "startup", "app", "platform"],
    health: ["medical", "health", "disease", "treatment", "vaccine", "hospital", "doctor", "medicine"],
    science: ["research", "study", "discovery", "experiment", "scientist", "laboratory", "analysis"],
    world: ["international", "global", "country", "nation", "diplomatic", "foreign", "worldwide"],
  }

  /**
   * TF-IDF based classification with location and complexity scoring
   */
  classifyArticle(
    article: NewsArticle,
    userLocation?: string,
  ): {
    category: string
    confidence: number
    locationRelevance: number
    complexity: number
  } {
    const text = `${article.title} ${article.content}`.toLowerCase()
    const words = text.split(/\s+/)

    // Calculate TF-IDF scores for each category
    const categoryScores: Record<string, number> = {}

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      let score = 0
      const totalWords = words.length

      for (const keyword of keywords) {
        const tf = this.calculateTF(keyword, words)
        const idf = this.calculateIDF(keyword)
        score += tf * idf
      }

      categoryScores[category] = score / keywords.length
    }

    // Find best category
    const bestCategory = Object.entries(categoryScores).sort(([, a], [, b]) => b - a)[0]

    // Calculate location relevance
    const locationRelevance = this.calculateLocationRelevance(article, userLocation)

    // Calculate complexity score
    const complexity = this.calculateComplexity(text)

    return {
      category: bestCategory[0],
      confidence: Math.min(bestCategory[1] * 100, 100),
      locationRelevance,
      complexity,
    }
  }

  private calculateTF(term: string, words: string[]): number {
    const termCount = words.filter((word) => word.includes(term)).length
    return termCount / words.length
  }

  private calculateIDF(term: string): number {
    // Simplified IDF calculation
    const documentFrequency = 0.1 // Assume 10% of documents contain the term
    return Math.log(1 / documentFrequency)
  }

  private calculateLocationRelevance(article: NewsArticle, userLocation?: string): number {
    if (!userLocation || !article.location) return 0.5

    const articleLocation = article.location.toLowerCase()
    const userLoc = userLocation.toLowerCase()

    if (articleLocation.includes(userLoc) || userLoc.includes(articleLocation)) {
      return 1.0
    }

    // Check for same country/region
    const locationSimilarity = this.calculateLocationSimilarity(articleLocation, userLoc)
    return locationSimilarity
  }

  private calculateLocationSimilarity(loc1: string, loc2: string): number {
    // Simple similarity based on common words
    const words1 = loc1.split(/\s+/)
    const words2 = loc2.split(/\s+/)

    const commonWords = words1.filter((word) => words2.includes(word))
    return commonWords.length / Math.max(words1.length, words2.length)
  }

  private calculateComplexity(text: string): number {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
    const words = text.split(/\s+/)

    // Average sentence length
    const avgSentenceLength = words.length / sentences.length

    // Average word length
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length

    // Complexity score (0-1)
    const complexity = Math.min((avgSentenceLength / 20) * 0.6 + (avgWordLength / 8) * 0.4, 1)

    return complexity
  }

  /**
   * Multi-label classification for subcategories
   */
  classifySubcategories(article: NewsArticle): string[] {
    const subcategories: string[] = []
    const text = `${article.title} ${article.content}`.toLowerCase()

    const subcategoryKeywords = {
      "breaking-news": ["breaking", "urgent", "alert", "developing"],
      analysis: ["analysis", "opinion", "perspective", "commentary"],
      local: ["local", "city", "community", "neighborhood"],
      international: ["international", "global", "worldwide", "foreign"],
      trending: ["viral", "trending", "popular", "buzz"],
    }

    for (const [subcategory, keywords] of Object.entries(subcategoryKeywords)) {
      const score =
        keywords.reduce((sum, keyword) => {
          return sum + (text.includes(keyword) ? 1 : 0)
        }, 0) / keywords.length

      if (score > 0.3) {
        subcategories.push(subcategory)
      }
    }

    return subcategories
  }
}

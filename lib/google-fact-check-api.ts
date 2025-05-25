interface FactCheckClaim {
  text: string
  claimant?: string
  claimDate?: string
}

interface FactCheckRating {
  ratingValue: number
  textualRating: string
  bestRating?: number
  worstRating?: number
}

interface FactCheckReview {
  publisher: {
    name: string
    site?: string
  }
  url: string
  title: string
  reviewDate: string
  textualRating: string
  languageCode: string
}

interface FactCheckClaimReview {
  claim: FactCheckClaim
  claimReview: FactCheckReview[]
}

interface GoogleFactCheckResponse {
  claims: FactCheckClaimReview[]
  nextPageToken?: string
}

interface FactCheckResult {
  credibilityScore: number
  summary: string
  details: {
    totalClaims: number
    verifiedClaims: number
    ratings: Array<{
      rating: string
      source: string
      url: string
      title: string
    }>
  }
  searchQueries: string[]
}

const GOOGLE_FACT_CHECK_API_KEY = "AIzaSyCb04teN4cFD1RTidUeJB5M6jM4jdOAUXU"
const FACT_CHECK_API_BASE_URL = "https://factchecktools.googleapis.com/v1alpha1/claims:search"

// Rating mappings for different fact-checking organizations
const RATING_MAPPINGS: Record<string, number> = {
  // Standard ratings
  true: 100,
  "mostly true": 85,
  "half true": 50,
  "mostly false": 25,
  false: 0,
  "pants on fire": 0,

  // PolitiFact ratings
  "true!": 100,
  "mostly true!": 85,
  "half-true": 50,
  "barely true": 30,
  "mostly false!": 25,
  "false!": 0,

  // Snopes ratings
  correct: 100,
  "mostly correct": 85,
  mixture: 50,
  "mostly incorrect": 25,
  incorrect: 0,
  unproven: 40,
  undetermined: 40,

  // FactCheck.org ratings
  accurate: 100,
  misleading: 30,
  inaccurate: 0,
  unsupported: 20,

  // AFP Fact Check
  correct: 100,
  misleading: 30,
  false: 0,

  // Reuters Fact Check
  correct: 100,
  "partly false": 40,
  false: 0,

  // Generic ratings
  verified: 90,
  unverified: 30,
  disputed: 20,
  debunked: 0,
  confirmed: 95,
  refuted: 5,
}

// Trusted fact-checking sources with reliability weights
const SOURCE_RELIABILITY: Record<string, number> = {
  "politifact.com": 0.95,
  "snopes.com": 0.9,
  "factcheck.org": 0.95,
  "reuters.com": 0.9,
  "apnews.com": 0.9,
  "afp.com": 0.85,
  "bbc.com": 0.85,
  "washingtonpost.com": 0.8,
  "nytimes.com": 0.8,
  "cnn.com": 0.75,
  "usatoday.com": 0.75,
  "checkyourfact.com": 0.7,
  "truthorfiction.com": 0.7,
  "leadstories.com": 0.7,
  "fullfact.org": 0.85,
  "factcheckni.org": 0.8,
  "africacheck.org": 0.8,
  "chequeado.com": 0.75,
  "teyit.org": 0.75,
  "boomlive.in": 0.7,
  "altnews.in": 0.7,
  "vishvasnews.com": 0.7,
  "factly.in": 0.7,
  "newsmobile.in": 0.65,
  "thequint.com": 0.7,
  "webqoof.com": 0.7,
}

export async function searchFactChecks(query: string, maxResults = 10): Promise<GoogleFactCheckResponse> {
  try {
    const url = new URL(FACT_CHECK_API_BASE_URL)
    url.searchParams.append("key", GOOGLE_FACT_CHECK_API_KEY)
    url.searchParams.append("query", query)
    url.searchParams.append("pageSize", maxResults.toString())
    url.searchParams.append("languageCode", "en")

    console.log(`Searching fact checks for: "${query}"`)

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.error(`Fact Check API error: ${response.status} ${response.statusText}`)
      throw new Error(`Fact Check API error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`Found ${data.claims?.length || 0} fact check results for "${query}"`)

    return data
  } catch (error) {
    console.error("Error searching fact checks:", error)
    throw error
  }
}

export function extractKeyEntities(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase()

  // Common entities to look for
  const entities: string[] = []

  // Extract quoted text (often claims)
  const quotes = text.match(/"([^"]+)"/g)
  if (quotes) {
    entities.push(...quotes.map((q) => q.replace(/"/g, "")))
  }

  // Extract proper nouns (capitalized words)
  const properNouns = (title + " " + content).match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g)
  if (properNouns) {
    entities.push(
      ...properNouns.filter(
        (noun) => noun.length > 2 && !["The", "This", "That", "These", "Those", "A", "An"].includes(noun),
      ),
    )
  }

  // Extract numbers with context
  const numberClaims = text.match(/\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:percent|%|million|billion|trillion|thousand)\b/g)
  if (numberClaims) {
    entities.push(...numberClaims)
  }

  // Remove duplicates and return
  return [...new Set(entities)].slice(0, 10) // Limit to 10 entities
}

export function generateSearchQueries(title: string, content: string, summary?: string): string[] {
  const queries: string[] = []

  // Use the title as primary query
  queries.push(title)

  // Use summary if available
  if (summary && summary.length > 10) {
    queries.push(summary)
  }

  // Extract key entities and create targeted queries
  const entities = extractKeyEntities(title, content)
  entities.forEach((entity) => {
    if (entity.length > 5) {
      queries.push(entity)
    }
  })

  // Create combination queries for better matching
  if (entities.length >= 2) {
    queries.push(`${entities[0]} ${entities[1]}`)
  }

  // Remove duplicates and limit queries
  return [...new Set(queries)].slice(0, 5)
}

export function calculateCredibilityScore(claims: FactCheckClaimReview[]): {
  score: number
  details: FactCheckResult["details"]
} {
  if (!claims || claims.length === 0) {
    return {
      score: 50, // Neutral score when no fact checks found
      details: {
        totalClaims: 0,
        verifiedClaims: 0,
        ratings: [],
      },
    }
  }

  let totalScore = 0
  let totalWeight = 0
  const ratings: FactCheckResult["details"]["ratings"] = []

  claims.forEach((claim) => {
    claim.claimReview.forEach((review) => {
      const rating = review.textualRating.toLowerCase().trim()
      const publisherSite = review.publisher.site || review.url

      // Get base score from rating
      let ratingScore = RATING_MAPPINGS[rating] ?? 50

      // Apply partial matching for ratings not in our mapping
      if (!(rating in RATING_MAPPINGS)) {
        if (rating.includes("true") || rating.includes("correct") || rating.includes("accurate")) {
          ratingScore = 80
        } else if (rating.includes("false") || rating.includes("incorrect") || rating.includes("wrong")) {
          ratingScore = 20
        } else if (rating.includes("misleading") || rating.includes("partly")) {
          ratingScore = 40
        } else if (rating.includes("unverified") || rating.includes("unproven")) {
          ratingScore = 35
        }
      }

      // Get source reliability weight
      let sourceWeight = 0.5 // Default weight for unknown sources

      for (const [domain, weight] of Object.entries(SOURCE_RELIABILITY)) {
        if (publisherSite?.includes(domain) || review.url.includes(domain)) {
          sourceWeight = weight
          break
        }
      }

      // Calculate weighted score
      const weightedScore = ratingScore * sourceWeight
      totalScore += weightedScore
      totalWeight += sourceWeight

      ratings.push({
        rating: review.textualRating,
        source: review.publisher.name,
        url: review.url,
        title: review.title,
      })
    })
  })

  // Calculate final score
  const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50

  return {
    score: Math.max(0, Math.min(100, finalScore)),
    details: {
      totalClaims: claims.length,
      verifiedClaims: claims.filter((claim) => claim.claimReview.length > 0).length,
      ratings,
    },
  }
}

export function generateSummary(score: number, details: FactCheckResult["details"]): string {
  if (details.totalClaims === 0) {
    return "No relevant fact checks found for this article. This doesn't necessarily indicate the content is false, but independent verification is recommended."
  }

  const { ratings } = details
  const topRating = ratings[0] // Most relevant rating

  if (score >= 71) {
    if (ratings.length === 1) {
      return `Claim verified as "${topRating.rating}" by ${topRating.source}. High credibility based on fact-checking analysis.`
    } else {
      return `Multiple fact checks support the credibility of claims in this article. ${ratings.length} verification(s) found with generally positive ratings.`
    }
  } else if (score >= 31) {
    if (ratings.length === 1) {
      return `Claim rated "${topRating.rating}" by ${topRating.source}. Mixed or uncertain credibility - additional verification recommended.`
    } else {
      return `Mixed fact-checking results found. ${ratings.length} verification(s) with varying ratings suggest uncertain credibility.`
    }
  } else {
    if (ratings.length === 1) {
      return `Claim rated "${topRating.rating}" by ${topRating.source}. Low credibility based on fact-checking analysis.`
    } else {
      return `Multiple fact checks indicate low credibility. ${ratings.length} verification(s) found with predominantly negative ratings.`
    }
  }
}

export async function analyzeArticleCredibility(
  title: string,
  content: string,
  summary?: string,
): Promise<FactCheckResult> {
  try {
    console.log("Starting fact check analysis for:", title.substring(0, 50) + "...")

    // Generate search queries
    const searchQueries = generateSearchQueries(title, content, summary)
    console.log("Generated search queries:", searchQueries)

    // Search for fact checks using multiple queries
    const allClaims: FactCheckClaimReview[] = []

    for (const query of searchQueries) {
      try {
        const response = await searchFactChecks(query, 5)
        if (response.claims) {
          allClaims.push(...response.claims)
        }

        // Add delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200))
      } catch (error) {
        console.error(`Error searching for query "${query}":`, error)
        // Continue with other queries even if one fails
      }
    }

    // Remove duplicate claims based on URL
    const uniqueClaims = allClaims.filter(
      (claim, index, self) =>
        index ===
        self.findIndex((c) => c.claimReview.some((review) => claim.claimReview.some((r) => r.url === review.url))),
    )

    console.log(`Found ${uniqueClaims.length} unique fact check claims`)

    // Calculate credibility score
    const { score, details } = calculateCredibilityScore(uniqueClaims)

    // Generate summary
    const summaryText = generateSummary(score, details)

    const result: FactCheckResult = {
      credibilityScore: score,
      summary: summaryText,
      details,
      searchQueries,
    }

    console.log("Fact check analysis complete:", {
      score,
      totalClaims: details.totalClaims,
      summary: summaryText.substring(0, 100) + "...",
    })

    return result
  } catch (error) {
    console.error("Error in fact check analysis:", error)

    // Return neutral result on error
    return {
      credibilityScore: 50,
      summary: "Unable to complete fact check analysis due to technical issues. Manual verification recommended.",
      details: {
        totalClaims: 0,
        verifiedClaims: 0,
        ratings: [],
      },
      searchQueries: [],
    }
  }
}

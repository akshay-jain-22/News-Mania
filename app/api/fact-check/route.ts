import { type NextRequest, NextResponse } from "next/server"

interface FactCheckClaim {
  text: string
  claimant?: string
  claimDate?: string
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

// Rating mappings for different fact-checking organizations
const RATING_MAPPINGS: Record<string, number> = {
  // Standard ratings
  true: 95,
  "mostly true": 85,
  "half true": 50,
  "mostly false": 25,
  false: 5,
  "pants on fire": 0,

  // PolitiFact ratings
  "true!": 95,
  "mostly true!": 85,
  "half-true": 50,
  "barely true": 30,
  "mostly false!": 25,
  "false!": 5,

  // Snopes ratings
  correct: 95,
  "mostly correct": 85,
  mixture: 50,
  "mostly incorrect": 25,
  incorrect: 5,
  unproven: 40,
  undetermined: 40,

  // FactCheck.org ratings
  accurate: 95,
  misleading: 30,
  inaccurate: 5,
  unsupported: 20,

  // AFP Fact Check
  correct: 95,
  misleading: 30,
  false: 5,

  // Reuters Fact Check
  correct: 95,
  "partly false": 40,
  false: 5,

  // Generic ratings
  verified: 90,
  unverified: 30,
  disputed: 20,
  debunked: 5,
  confirmed: 95,
  refuted: 10,
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
}

async function searchGoogleFactCheck(query: string): Promise<GoogleFactCheckResponse> {
  const API_KEY = process.env.GOOGLE_FACT_CHECK_API || process.env.google_fact_check_api

  if (!API_KEY) {
    console.error("Google Fact Check API key not found")
    throw new Error("API key not configured")
  }

  const url = new URL("https://factchecktools.googleapis.com/v1alpha1/claims:search")
  url.searchParams.append("key", API_KEY)
  url.searchParams.append("query", query)
  url.searchParams.append("pageSize", "10")
  url.searchParams.append("languageCode", "en")

  console.log(`Searching Google Fact Check API for: "${query}"`)

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "Newsmania/1.0",
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Google Fact Check API error: ${response.status} ${response.statusText}`, errorText)
    throw new Error(`API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log(`Google API returned ${data.claims?.length || 0} claims for "${query}"`)

  return data
}

function extractKeyPhrases(title: string, content: string): string[] {
  const text = `${title} ${content}`
  const phrases: string[] = []

  // Add the full title
  phrases.push(title)

  // Extract quoted statements
  const quotes = text.match(/"([^"]{10,100})"/g)
  if (quotes) {
    phrases.push(...quotes.map((q) => q.replace(/"/g, "")))
  }

  // Extract sentences with strong claims
  const sentences = text.split(/[.!?]+/)
  sentences.forEach((sentence) => {
    const trimmed = sentence.trim()
    if (trimmed.length > 20 && trimmed.length < 150) {
      // Look for sentences with claim indicators
      if (/\b(claims?|says?|states?|reports?|announces?|reveals?|shows?|proves?|confirms?|denies?)\b/i.test(trimmed)) {
        phrases.push(trimmed)
      }
    }
  })

  // Extract proper nouns and entities
  const entities = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g)
  if (entities) {
    const filteredEntities = entities.filter(
      (entity) =>
        entity.length > 3 && !["The", "This", "That", "These", "Those", "A", "An", "And", "But", "Or"].includes(entity),
    )
    phrases.push(...filteredEntities.slice(0, 5))
  }

  // Remove duplicates and limit
  return [...new Set(phrases)].slice(0, 8)
}

function calculateCredibilityScore(claims: FactCheckClaimReview[]): {
  score: number
  summary: string
  details: Array<{
    rating: string
    source: string
    url: string
    title: string
  }>
} {
  if (!claims || claims.length === 0) {
    return {
      score: 50,
      summary:
        "No fact-check results found for this article. This doesn't necessarily mean the content is false, but independent verification is recommended.",
      details: [],
    }
  }

  let totalScore = 0
  let totalWeight = 0
  const details: Array<{
    rating: string
    source: string
    url: string
    title: string
  }> = []

  claims.forEach((claim) => {
    claim.claimReview.forEach((review) => {
      const rating = review.textualRating.toLowerCase().trim()
      const publisherSite = review.publisher.site || review.url

      // Get base score from rating
      let ratingScore = RATING_MAPPINGS[rating]

      // If exact match not found, try partial matching
      if (ratingScore === undefined) {
        if (
          rating.includes("true") ||
          rating.includes("correct") ||
          rating.includes("accurate") ||
          rating.includes("verified")
        ) {
          ratingScore = 80
        } else if (
          rating.includes("false") ||
          rating.includes("incorrect") ||
          rating.includes("wrong") ||
          rating.includes("debunked")
        ) {
          ratingScore = 15
        } else if (rating.includes("misleading") || rating.includes("partly") || rating.includes("mixed")) {
          ratingScore = 35
        } else if (rating.includes("unverified") || rating.includes("unproven") || rating.includes("unclear")) {
          ratingScore = 40
        } else {
          ratingScore = 50 // Default neutral
        }
      }

      // Get source reliability weight
      let sourceWeight = 0.5 // Default weight

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

      details.push({
        rating: review.textualRating,
        source: review.publisher.name,
        url: review.url,
        title: review.title,
      })

      console.log(
        `Rating: ${review.textualRating} -> Score: ${ratingScore}, Weight: ${sourceWeight}, Weighted: ${weightedScore}`,
      )
    })
  })

  // Calculate final score
  const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50

  // Generate summary based on score and findings
  let summary = ""
  const topRating = details[0]

  if (finalScore >= 75) {
    summary =
      details.length === 1
        ? `Fact-checked as "${topRating.rating}" by ${topRating.source}. High credibility based on verification.`
        : `Multiple fact-checks support high credibility. ${details.length} verification(s) found with positive ratings.`
  } else if (finalScore >= 45) {
    summary =
      details.length === 1
        ? `Rated "${topRating.rating}" by ${topRating.source}. Mixed credibility - additional verification recommended.`
        : `Mixed fact-check results found. ${details.length} verification(s) with varying ratings suggest uncertain credibility.`
  } else {
    summary =
      details.length === 1
        ? `Rated "${topRating.rating}" by ${topRating.source}. Low credibility based on fact-checking analysis.`
        : `Multiple fact-checks indicate concerns. ${details.length} verification(s) found with predominantly negative ratings.`
  }

  console.log(`Final credibility score: ${finalScore}% based on ${claims.length} claims and ${details.length} reviews`)

  return {
    score: Math.max(0, Math.min(100, finalScore)),
    summary,
    details,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, content, description } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    console.log("Starting fact-check analysis for:", title.substring(0, 50) + "...")

    // Generate search queries
    const searchQueries = extractKeyPhrases(title, content || description || "")
    console.log("Generated search queries:", searchQueries)

    // Search Google Fact Check API with multiple queries
    const allClaims: FactCheckClaimReview[] = []

    for (const query of searchQueries) {
      try {
        const response = await searchGoogleFactCheck(query)
        if (response.claims && response.claims.length > 0) {
          allClaims.push(...response.claims)
          console.log(`Found ${response.claims.length} claims for query: "${query}"`)
        }

        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 300))
      } catch (error) {
        console.error(`Error searching for query "${query}":`, error)
        // Continue with other queries
      }
    }

    // Remove duplicate claims based on URL
    const uniqueClaims = allClaims.filter(
      (claim, index, self) =>
        index ===
        self.findIndex((c) => c.claimReview.some((review) => claim.claimReview.some((r) => r.url === review.url))),
    )

    console.log(`Found ${uniqueClaims.length} unique fact-check claims`)

    // Calculate credibility score
    const result = calculateCredibilityScore(uniqueClaims)

    // Convert to expected format
    const claimsAnalyzed = uniqueClaims.map((claim) => ({
      claim: claim.claim.text,
      verdict:
        result.score >= 75
          ? ("true" as const)
          : result.score >= 45
            ? ("partially true" as const)
            : result.score >= 25
              ? ("false" as const)
              : ("unverified" as const),
      explanation: claim.claimReview[0]?.title || "Fact-checked by multiple sources",
      sources: claim.claimReview.map((review) => review.url),
    }))

    const factCheckResult = {
      isFactChecked: true,
      credibilityScore: result.score,
      factCheckResult: result.summary,
      claimsAnalyzed,
      searchQueries,
    }

    console.log("Fact-check complete:", {
      score: result.score,
      totalClaims: uniqueClaims.length,
      summary: result.summary.substring(0, 100) + "...",
    })

    return NextResponse.json(factCheckResult)
  } catch (error) {
    console.error("Fact-check API error:", error)

    // Return a more informative error response
    return NextResponse.json({
      isFactChecked: true,
      credibilityScore: 50,
      factCheckResult: `Unable to complete comprehensive fact-check analysis: ${error instanceof Error ? error.message : "Unknown error"}. Manual verification recommended.`,
      claimsAnalyzed: [],
      searchQueries: [],
    })
  }
}

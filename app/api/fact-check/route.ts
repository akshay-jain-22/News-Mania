import { type NextRequest, NextResponse } from "next/server"
import { analyzeArticleWithGrok, testGrokConnection } from "@/lib/grok-fact-check"

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
  claims?: FactCheckClaimReview[]
  nextPageToken?: string
}

// Enhanced rating mappings
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
  "needs context": 45,
  "missing context": 40,
}

// Source reliability weights
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
  url.searchParams.append("query", encodeURIComponent(query))
  url.searchParams.append("pageSize", "10")
  url.searchParams.append("languageCode", "en")

  console.log(`🔍 Searching Google Fact Check API for: "${query}"`)

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Newsmania/1.0",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Google Fact Check API error: ${response.status} ${response.statusText}`, errorText)

      // Return empty response instead of throwing
      return { claims: [] }
    }

    const data = await response.json()
    console.log(`✅ Google API returned ${data.claims?.length || 0} claims for "${query}"`)
    console.log("📊 Raw API response:", JSON.stringify(data, null, 2))

    return data
  } catch (error) {
    console.error("🚨 Error calling Google Fact Check API:", error)
    return { claims: [] }
  }
}

function extractSearchQueries(title: string, content: string): string[] {
  const queries: string[] = []

  // Primary query: the full title
  queries.push(title)

  // Extract company/organization names from title
  const companyMatches = title.match(/\b[A-Z][a-z]*(?:\s+[A-Z][a-z]*)*\b/g)
  if (companyMatches) {
    companyMatches.forEach((company) => {
      if (
        company.length > 2 &&
        !["The", "A", "An", "And", "Or", "But", "In", "On", "At", "To", "For", "Of", "With", "By"].includes(company)
      ) {
        queries.push(company)
      }
    })
  }

  // Extract key phrases from title
  const titleWords = title.split(/\s+/)
  if (titleWords.length > 3) {
    // Take first half and second half of title as separate queries
    const midPoint = Math.floor(titleWords.length / 2)
    const firstHalf = titleWords.slice(0, midPoint + 2).join(" ")
    const secondHalf = titleWords.slice(midPoint - 1).join(" ")

    if (firstHalf.length > 10) queries.push(firstHalf)
    if (secondHalf.length > 10) queries.push(secondHalf)
  }

  // Extract quoted content
  const quotes = (title + " " + content).match(/"([^"]{10,100})"/g)
  if (quotes) {
    quotes.forEach((quote) => {
      const cleaned = quote.replace(/"/g, "").trim()
      if (cleaned.length > 10) {
        queries.push(cleaned)
      }
    })
  }

  // Extract numerical claims
  const numbers = title.match(
    /\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:percent|%|million|billion|trillion|thousand|days?|years?|months?)\b/gi,
  )
  if (numbers) {
    numbers.forEach((num) => {
      queries.push(`${num} ${title.split(" ").slice(0, 5).join(" ")}`)
    })
  }

  // Remove duplicates and limit
  const uniqueQueries = [...new Set(queries)].slice(0, 6)
  console.log("🎯 Generated search queries:", uniqueQueries)

  return uniqueQueries
}

function analyzeContentCredibility(
  title: string,
  content: string,
): {
  score: number
  factors: string[]
} {
  let score = 50 // Start neutral
  const factors: string[] = []

  const text = (title + " " + content).toLowerCase()

  // Positive indicators
  if (/\b(according to|sources say|reported by|study shows|data reveals|research indicates)\b/.test(text)) {
    score += 10
    factors.push("✅ Cites sources or research")
  }

  if (/\b(said|stated|announced|confirmed|reported)\b/.test(text)) {
    score += 5
    factors.push("✅ Uses attribution")
  }

  // Negative indicators
  if (/\b(shocking|unbelievable|you won't believe|secret|they don't want you to know)\b/.test(text)) {
    score -= 15
    factors.push("❌ Uses sensationalist language")
  }

  if (/\b(all|every|always|never|no one|everyone)\b/.test(text)) {
    score -= 8
    factors.push("⚠️ Uses absolute language")
  }

  if (/\b(allegedly|reportedly|rumored|unconfirmed)\b/.test(text)) {
    score -= 5
    factors.push("⚠️ Contains unverified claims")
  }

  // Source quality indicators
  if (/\b(techcrunch|yahoo finance|reuters|bloomberg|wall street journal|financial times)\b/.test(text)) {
    score += 15
    factors.push("✅ Reputable news source")
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    factors,
  }
}

function calculateCredibilityScore(
  claims: FactCheckClaimReview[],
  contentAnalysis: { score: number; factors: string[] },
): {
  score: number
  summary: string
  details: Array<{
    rating: string
    source: string
    url: string
    title: string
  }>
  factors: string[]
} {
  const details: Array<{
    rating: string
    source: string
    url: string
    title: string
  }> = []

  if (!claims || claims.length === 0) {
    // Use content analysis when no fact checks found
    const score = contentAnalysis.score
    return {
      score,
      summary:
        score >= 70
          ? "No specific fact-checks found, but content analysis suggests good credibility based on source and language patterns."
          : score >= 40
            ? "No specific fact-checks found. Content analysis shows mixed indicators - verify through additional sources."
            : "No specific fact-checks found, and content analysis shows potential credibility concerns.",
      details: [],
      factors: contentAnalysis.factors,
    }
  }

  let totalScore = 0
  let totalWeight = 0

  claims.forEach((claim) => {
    // Safely access claim properties
    const claimText = claim.claim?.text || "Unknown claim"

    if (claim.claimReview && Array.isArray(claim.claimReview)) {
      claim.claimReview.forEach((review) => {
        const rating = (review.textualRating || "").toLowerCase().trim()
        const publisherSite = review.publisher?.site || review.url || ""

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
          } else if (
            rating.includes("misleading") ||
            rating.includes("partly") ||
            rating.includes("mixed") ||
            rating.includes("context")
          ) {
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
          if (publisherSite.includes(domain) || (review.url && review.url.includes(domain))) {
            sourceWeight = weight
            break
          }
        }

        // Calculate weighted score
        const weightedScore = ratingScore * sourceWeight
        totalScore += weightedScore
        totalWeight += sourceWeight

        details.push({
          rating: review.textualRating || "Unknown rating",
          source: review.publisher?.name || "Unknown source",
          url: review.url || "",
          title: review.title || claimText,
        })

        console.log(
          `📊 Rating: "${review.textualRating}" -> Score: ${ratingScore}, Weight: ${sourceWeight}, Weighted: ${weightedScore}`,
        )
      })
    }
  })

  // Combine fact-check score with content analysis
  let finalScore: number
  if (totalWeight > 0) {
    const factCheckScore = Math.round(totalScore / totalWeight)
    // Weight fact-check results more heavily than content analysis
    finalScore = Math.round(factCheckScore * 0.7 + contentAnalysis.score * 0.3)
  } else {
    finalScore = contentAnalysis.score
  }

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

  console.log(`🎯 Final credibility score: ${finalScore}% (fact-checks: ${claims.length}, reviews: ${details.length})`)

  return {
    score: Math.max(0, Math.min(100, finalScore)),
    summary,
    details,
    factors: contentAnalysis.factors,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, content, description } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    console.log("🚀 Starting Grok-powered fact-check analysis for:", title.substring(0, 50) + "...")

    // Test Grok connection first
    console.log("🧪 Testing Grok connection...")
    const connectionTest = await testGrokConnection()

    if (!connectionTest) {
      console.error("❌ Grok connection failed, using fallback analysis")
      return NextResponse.json({
        isFactChecked: true,
        credibilityScore: 50,
        factCheckResult:
          "Unable to connect to Grok AI for analysis. Please check your API configuration and try again.",
        claimsAnalyzed: [],
        analysisFactors: ["❌ Grok AI connection failed", "⚠️ Fallback analysis not available"],
        analyzedBy: "Connection Test Failed",
      })
    }

    console.log("✅ Grok connection successful, proceeding with analysis...")

    // Use Grok to analyze the article
    const grokResult = await analyzeArticleWithGrok(title, content || "", description || "")

    // Convert to our expected format
    const claimsAnalyzed = grokResult.claimsAnalyzed.map((claim) => ({
      claim: claim.claim,
      verdict: claim.verdict,
      explanation: claim.explanation,
      sources: [], // Grok doesn't provide specific source URLs
    }))

    const factCheckResult = {
      isFactChecked: true,
      credibilityScore: grokResult.credibilityScore,
      factCheckResult: grokResult.summary,
      claimsAnalyzed,
      analysisFactors: grokResult.analysisFactors,
      analyzedBy: "Grok AI by xAI",
    }

    console.log("✅ Grok fact-check complete:", {
      score: grokResult.credibilityScore,
      summary: grokResult.summary.substring(0, 100) + "...",
      factorsCount: grokResult.analysisFactors.length,
      claimsCount: grokResult.claimsAnalyzed.length,
    })

    return NextResponse.json(factCheckResult)
  } catch (error) {
    console.error("🚨 Fact-check API error:", error)

    // Return a more informative error response
    return NextResponse.json({
      isFactChecked: true,
      credibilityScore: 50,
      factCheckResult: `Fact-check analysis encountered an error: ${error instanceof Error ? error.message : "Unknown error"}. This may be due to API connectivity issues or rate limiting.`,
      claimsAnalyzed: [],
      analysisFactors: [
        "❌ Technical error during analysis",
        `⚠️ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
      analyzedBy: "Error Handler",
    })
  }
}

// Add a test endpoint to check Grok connectivity
export async function GET() {
  try {
    const connectionTest = await testGrokConnection()

    return NextResponse.json({
      status: connectionTest ? "connected" : "disconnected",
      message: connectionTest
        ? "Grok AI connection is working properly"
        : "Grok AI connection failed - check API configuration",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: `Connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

import { xai } from "@ai-sdk/xai"
import { generateText } from "ai"

interface GrokFactCheckResult {
  credibilityScore: number
  summary: string
  analysisFactors: string[]
  claimsAnalyzed: Array<{
    claim: string
    verdict: "true" | "false" | "partially true" | "unverified"
    explanation: string
  }>
}

export async function analyzeArticleWithGrok(
  title: string,
  content: string,
  description?: string,
): Promise<GrokFactCheckResult> {
  try {
    console.log("🤖 Starting Grok fact-check analysis...")
    console.log("📝 Article title:", title)
    console.log("📝 Content length:", content?.length || 0)

    // Check if we have the API key
    if (!process.env.XAI_API_KEY) {
      console.error("❌ XAI_API_KEY not found in environment variables")
      throw new Error("XAI_API_KEY not configured")
    }

    console.log("✅ XAI_API_KEY found, proceeding with analysis...")

    // Prepare the article content
    const articleText = `
TITLE: ${title}

DESCRIPTION: ${description || "No description available"}

CONTENT: ${content || "No content available"}
    `.trim()

    // Use the exact prompt format you specified
    const prompt = `You are a credibility analysis AI. Given the following news article, analyze it for factual accuracy, source reliability, bias, and tone. Then return:

1. A **Credibility Score** from 0 to 100% (where 100% = highly credible).
2. A short **Summary** of the article (2-3 lines).
3. A brief explanation of why you gave that credibility score.

Use only the information available in the article and general public knowledge (no hallucination).

News Article:
"""
${articleText}
"""

Please respond in this exact format:
Credibility Score: [number]%

Summary: [2-3 line summary]

Explanation: [brief explanation of the credibility score]`

    console.log("🚀 Sending request to Grok AI...")

    const result = await generateText({
      model: xai("grok-beta"),
      prompt,
      temperature: 0.3,
      maxTokens: 1000,
    })

    console.log("✅ Received response from Grok AI")
    console.log("📄 Raw response:", result.text)

    // Parse the response
    const parsedResult = parseGrokResponse(result.text, title)

    console.log("🎯 Parsed result:", {
      score: parsedResult.credibilityScore,
      summary: parsedResult.summary.substring(0, 100) + "...",
      factorsCount: parsedResult.analysisFactors.length,
    })

    return parsedResult
  } catch (error) {
    console.error("🚨 Error in Grok analysis:", error)
    console.error("🚨 Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack?.substring(0, 500) : "No stack trace",
    })

    // Return a meaningful fallback
    throw error // Re-throw to be handled by the API route
  }
}

function parseGrokResponse(responseText: string, title: string): GrokFactCheckResult {
  console.log("🔍 Parsing Grok response...")

  try {
    // Extract credibility score
    const scoreMatch = responseText.match(/Credibility Score:\s*(\d+)%?/i)
    let credibilityScore = 50 // Default

    if (scoreMatch) {
      credibilityScore = Number.parseInt(scoreMatch[1])
      if (isNaN(credibilityScore) || credibilityScore < 0 || credibilityScore > 100) {
        credibilityScore = 50
      }
    }

    // Extract summary
    const summaryMatch = responseText.match(/Summary:\s*(.+?)(?=\n\n|\nExplanation:|$)/is)
    let summary = `Analysis of "${title}" completed with ${credibilityScore}% credibility score.`

    if (summaryMatch) {
      summary = summaryMatch[1].trim().replace(/\n/g, " ")
    }

    // Extract explanation
    const explanationMatch = responseText.match(/Explanation:\s*(.+?)$/is)
    let explanation = "Analysis completed based on content evaluation."

    if (explanationMatch) {
      explanation = explanationMatch[1].trim().replace(/\n/g, " ")
    }

    // Generate analysis factors based on the score and explanation
    const analysisFactors = generateAnalysisFactors(credibilityScore, explanation, responseText)

    // Generate claims based on the analysis
    const claimsAnalyzed = generateClaimsAnalyzed(credibilityScore, explanation, title)

    return {
      credibilityScore,
      summary,
      analysisFactors,
      claimsAnalyzed,
    }
  } catch (error) {
    console.error("❌ Error parsing Grok response:", error)

    // Return a basic parsed result
    return {
      credibilityScore: 50,
      summary: `Analysis of "${title}" completed. Manual review recommended.`,
      analysisFactors: ["🤖 Grok AI analysis completed", "⚠️ Response parsing had issues"],
      claimsAnalyzed: [
        {
          claim: "Overall article assessment",
          verdict: "partially true",
          explanation: "Analysis completed with standard evaluation",
        },
      ],
    }
  }
}

function generateAnalysisFactors(score: number, explanation: string, fullResponse: string): string[] {
  const factors: string[] = []

  // Add factors based on score
  if (score >= 80) {
    factors.push("✅ High credibility score achieved")
  } else if (score >= 60) {
    factors.push("⚠️ Moderate credibility score")
  } else if (score >= 40) {
    factors.push("⚠️ Mixed credibility indicators")
  } else {
    factors.push("❌ Low credibility score")
  }

  // Add factors based on explanation content
  const explanationLower = explanation.toLowerCase()

  if (explanationLower.includes("reliable") || explanationLower.includes("credible")) {
    factors.push("✅ Grok identified reliable elements")
  }

  if (explanationLower.includes("bias") || explanationLower.includes("biased")) {
    factors.push("⚠️ Potential bias detected")
  }

  if (explanationLower.includes("source") || explanationLower.includes("attribution")) {
    factors.push("✅ Source attribution evaluated")
  }

  if (explanationLower.includes("concern") || explanationLower.includes("issue")) {
    factors.push("⚠️ Credibility concerns identified")
  }

  if (explanationLower.includes("false") || explanationLower.includes("misleading")) {
    factors.push("❌ Misleading content detected")
  }

  if (explanationLower.includes("tone") || explanationLower.includes("language")) {
    factors.push("📝 Language and tone analyzed")
  }

  // Ensure we have at least one factor
  if (factors.length === 0) {
    factors.push("🤖 Comprehensive analysis by Grok AI")
  }

  // Add Grok attribution
  factors.push("🤖 Analysis powered by Grok AI")

  return factors
}

function generateClaimsAnalyzed(
  score: number,
  explanation: string,
  title: string,
): Array<{
  claim: string
  verdict: "true" | "false" | "partially true" | "unverified"
  explanation: string
}> {
  const verdict: "true" | "false" | "partially true" | "unverified" =
    score >= 75 ? "true" : score >= 45 ? "partially true" : score >= 25 ? "unverified" : "false"

  return [
    {
      claim: `Main article claim: ${title}`,
      verdict,
      explanation: explanation.substring(0, 200) + (explanation.length > 200 ? "..." : ""),
    },
  ]
}

// Simple connection test
export async function testGrokConnection(): Promise<boolean> {
  try {
    console.log("🧪 Testing Grok AI connection...")

    if (!process.env.XAI_API_KEY) {
      console.error("❌ XAI_API_KEY not found")
      return false
    }

    const result = await generateText({
      model: xai("grok-beta"),
      prompt: "Respond with exactly: Connection successful",
      temperature: 0,
      maxTokens: 10,
    })

    const success = result.text.toLowerCase().includes("connection successful")
    console.log(success ? "✅ Grok connection successful" : "❌ Grok connection failed")
    console.log("🔍 Test response:", result.text)

    return success
  } catch (error) {
    console.error("❌ Grok connection test failed:", error)
    return false
  }
}

// Enhanced content analysis fallback
export function createEnhancedFallbackAnalysis(title: string, content: string): GrokFactCheckResult {
  console.log("🔄 Creating enhanced fallback analysis...")

  const text = (title + " " + content).toLowerCase()
  let score = 50 // Start neutral

  const factors: string[] = []

  // Positive indicators
  if (text.includes("according to") || text.includes("sources say") || text.includes("reported by")) {
    score += 15
    factors.push("✅ Contains source attribution")
  }

  if (text.includes("study") || text.includes("research") || text.includes("data")) {
    score += 12
    factors.push("✅ References research or data")
  }

  if (text.includes("said") || text.includes("stated") || text.includes("announced")) {
    score += 8
    factors.push("✅ Uses direct quotes")
  }

  // Check for reputable sources
  const reputableSources = [
    "reuters",
    "bloomberg",
    "associated press",
    "bbc",
    "cnn",
    "nytimes",
    "washingtonpost",
    "techcrunch",
    "yahoo finance",
    "wall street journal",
    "financial times",
  ]

  const foundSource = reputableSources.find((source) => text.includes(source))
  if (foundSource) {
    score += 20
    factors.push(`✅ Reputable source: ${foundSource}`)
  }

  // Negative indicators
  if (text.includes("shocking") || text.includes("unbelievable") || text.includes("you won't believe")) {
    score -= 20
    factors.push("❌ Sensationalist language detected")
  }

  if (text.includes("secret") || text.includes("they don't want you to know")) {
    score -= 15
    factors.push("❌ Conspiracy-style language")
  }

  if (text.includes("allegedly") || text.includes("reportedly") || text.includes("rumored")) {
    score -= 10
    factors.push("⚠️ Unverified claims present")
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score))

  factors.push("⚠️ Fallback analysis used (Grok AI unavailable)")

  return {
    credibilityScore: score,
    summary: `Fallback analysis of "${title}" indicates ${score >= 70 ? "good" : score >= 40 ? "mixed" : "concerning"} credibility based on content patterns and language analysis.`,
    analysisFactors: factors,
    claimsAnalyzed: [
      {
        claim: "Content pattern analysis",
        verdict: score >= 70 ? "true" : score >= 40 ? "partially true" : "unverified",
        explanation: "Assessment based on language patterns, source attribution, and content structure",
      },
    ],
  }
}

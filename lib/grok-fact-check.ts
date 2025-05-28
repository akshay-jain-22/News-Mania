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
  console.log("🤖 Starting Grok fact-check analysis...")
  console.log("🔑 Checking API key availability...")

  // Check if API key exists
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) {
    console.error("❌ XAI_API_KEY not found in environment variables")
    throw new Error("XAI_API_KEY not configured")
  }

  console.log("✅ XAI_API_KEY found, length:", apiKey.length)

  try {
    // Prepare the article content
    const articleText = `
TITLE: ${title}

DESCRIPTION: ${description || "No description available"}

CONTENT: ${content || "No content available"}
    `.trim()

    console.log("📝 Article prepared, length:", articleText.length)

    // Use the exact prompt format you specified
    const prompt = `You are a news verification assistant.

Given the following news article, perform a credibility assessment and return:
1. Credibility Score (0–100%)
2. Summary of the article (2–3 lines)
3. Reasons for credibility score

Article:
"${articleText}"

Please respond in this exact format:
Credibility Score: [number]%

Summary: [2-3 line summary of the article]

Reasons: [brief explanation of factors that influenced the credibility score]`

    console.log("🚀 Sending request to Grok AI...")
    console.log("📤 Prompt length:", prompt.length)

    const result = await generateText({
      model: xai("grok-beta"),
      prompt,
      temperature: 0.3,
      maxTokens: 500,
    })

    console.log("✅ Received response from Grok AI")
    console.log("📄 Raw response:", result.text)

    // Parse the response
    const parsedResult = parseGrokResponse(result.text, title)

    console.log("🎯 Final parsed result:", {
      score: parsedResult.credibilityScore,
      summary: parsedResult.summary.substring(0, 100) + "...",
      factorsCount: parsedResult.analysisFactors.length,
    })

    return parsedResult
  } catch (error) {
    console.error("🚨 Error in Grok analysis:", error)

    if (error instanceof Error) {
      console.error("🚨 Error name:", error.name)
      console.error("🚨 Error message:", error.message)
      console.error("🚨 Error stack:", error.stack?.substring(0, 500))
    }

    // Re-throw the error to be handled by the API route
    throw error
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
      console.log("✅ Extracted credibility score:", credibilityScore)
    } else {
      console.log("⚠️ Could not extract credibility score, using default:", credibilityScore)
    }

    // Extract summary
    const summaryMatch = responseText.match(/Summary:\s*(.+?)(?=\n\n|\nReasons:|$)/is)
    let summary = `Grok AI analysis of "${title}" completed with ${credibilityScore}% credibility score.`

    if (summaryMatch) {
      summary = summaryMatch[1].trim().replace(/\n/g, " ")
      console.log("✅ Extracted summary:", summary.substring(0, 100) + "...")
    } else {
      console.log("⚠️ Could not extract summary, using default")
    }

    // Extract reasons/explanation
    const reasonsMatch = responseText.match(/Reasons:\s*(.+?)$/is)
    let explanation = "Grok AI analysis completed based on content evaluation."

    if (reasonsMatch) {
      explanation = reasonsMatch[1].trim().replace(/\n/g, " ")
      console.log("✅ Extracted explanation:", explanation.substring(0, 100) + "...")
    } else {
      console.log("⚠️ Could not extract explanation, using default")
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
      summary: `Grok AI analysis of "${title}" completed. Response parsing encountered issues.`,
      analysisFactors: ["🤖 Grok AI analysis completed", "⚠️ Response parsing had minor issues"],
      claimsAnalyzed: [
        {
          claim: "Overall article assessment",
          verdict: "partially true",
          explanation: "Grok AI analysis completed with standard evaluation",
        },
      ],
    }
  }
}

function generateAnalysisFactors(score: number, explanation: string, fullResponse: string): string[] {
  const factors: string[] = []

  // Add factors based on score
  if (score >= 80) {
    factors.push("✅ High credibility score from Grok AI")
  } else if (score >= 60) {
    factors.push("⚠️ Moderate credibility score from Grok AI")
  } else if (score >= 40) {
    factors.push("⚠️ Mixed credibility indicators identified")
  } else {
    factors.push("❌ Low credibility score from Grok AI")
  }

  // Add factors based on explanation content
  const explanationLower = explanation.toLowerCase()

  if (
    explanationLower.includes("reliable") ||
    explanationLower.includes("credible") ||
    explanationLower.includes("trustworthy")
  ) {
    factors.push("✅ Grok identified reliable elements")
  }

  if (
    explanationLower.includes("bias") ||
    explanationLower.includes("biased") ||
    explanationLower.includes("partisan")
  ) {
    factors.push("⚠️ Potential bias detected by Grok")
  }

  if (
    explanationLower.includes("source") ||
    explanationLower.includes("attribution") ||
    explanationLower.includes("cited")
  ) {
    factors.push("✅ Source attribution evaluated by Grok")
  }

  if (
    explanationLower.includes("concern") ||
    explanationLower.includes("issue") ||
    explanationLower.includes("problem")
  ) {
    factors.push("⚠️ Credibility concerns identified by Grok")
  }

  if (
    explanationLower.includes("false") ||
    explanationLower.includes("misleading") ||
    explanationLower.includes("inaccurate")
  ) {
    factors.push("❌ Misleading content detected by Grok")
  }

  if (
    explanationLower.includes("sensational") ||
    explanationLower.includes("exaggerated") ||
    explanationLower.includes("clickbait")
  ) {
    factors.push("❌ Sensationalist language detected")
  }

  if (
    explanationLower.includes("factual") ||
    explanationLower.includes("accurate") ||
    explanationLower.includes("verified")
  ) {
    factors.push("✅ Factual content confirmed by Grok")
  }

  // Always add Grok attribution
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
      claim: `Article headline: "${title}"`,
      verdict,
      explanation: explanation.substring(0, 200) + (explanation.length > 200 ? "..." : ""),
    },
  ]
}

// Simple connection test
export async function testGrokConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    console.log("🧪 Testing Grok AI connection...")

    const apiKey = process.env.XAI_API_KEY
    if (!apiKey) {
      console.error("❌ XAI_API_KEY not found")
      return {
        success: false,
        message: "XAI_API_KEY environment variable not found",
        details: { hasApiKey: false },
      }
    }

    console.log("✅ API key found, testing connection...")

    const result = await generateText({
      model: xai("grok-beta"),
      prompt: "Respond with exactly: Connection successful",
      temperature: 0,
      maxTokens: 10,
    })

    const success = result.text.toLowerCase().includes("connection successful")
    console.log(success ? "✅ Grok connection successful" : "❌ Grok connection failed")
    console.log("🔍 Test response:", result.text)

    return {
      success,
      message: success ? "Grok AI connection working properly" : "Grok AI connection failed - unexpected response",
      details: { response: result.text, hasApiKey: true },
    }
  } catch (error) {
    console.error("❌ Grok connection test failed:", error)
    return {
      success: false,
      message: `Connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
        hasApiKey: !!process.env.XAI_API_KEY,
      },
    }
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
    "ap news",
    "npr",
    "pbs",
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

  factors.push("⚠️ Enhanced fallback analysis (Grok AI unavailable)")

  return {
    credibilityScore: score,
    summary: `Enhanced analysis of "${title}" indicates ${score >= 70 ? "good" : score >= 40 ? "mixed" : "concerning"} credibility based on content patterns, language analysis, and source evaluation.`,
    analysisFactors: factors,
    claimsAnalyzed: [
      {
        claim: "Content pattern analysis",
        verdict: score >= 70 ? "true" : score >= 40 ? "partially true" : "unverified",
        explanation: "Assessment based on language patterns, source attribution, and content structure analysis",
      },
    ],
  }
}

// Quick credibility check function for headlines
export async function quickCredibilityCheck(headline: string): Promise<number> {
  try {
    console.log("⚡ Quick credibility check for:", headline)

    const apiKey = process.env.XAI_API_KEY
    if (!apiKey) {
      console.error("❌ XAI_API_KEY not found for quick check")
      return 50 // Default neutral score
    }

    const prompt = `You are a news verification assistant. Analyze this headline for credibility and respond with ONLY a number between 0-100 representing the credibility score.

Headline: "${headline}"

Consider:
- Source plausibility
- Language tone (sensationalist vs factual)
- Logical consistency
- Potential for misinformation

Respond with ONLY the number (0-100), nothing else.`

    const result = await generateText({
      model: xai("grok-beta"),
      prompt,
      temperature: 0.1,
      maxTokens: 10,
    })

    const score = Number.parseInt(result.text.trim())

    if (isNaN(score) || score < 0 || score > 100) {
      console.error("❌ Invalid score from Grok:", result.text)
      return 50 // Default neutral score
    }

    console.log("✅ Quick check score:", score)
    return score
  } catch (error) {
    console.error("❌ Error in quick credibility check:", error)
    return 50 // Default neutral score
  }
}

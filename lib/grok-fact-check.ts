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
    console.log("🤖 Starting Grok fact-check analysis for:", title.substring(0, 50) + "...")

    const articleText = `
Title: ${title}
Description: ${description || "No description provided"}
Content: ${content || "No content provided"}
    `.trim()

    const prompt = `You are an expert fact-checker and media analyst. Analyze the following news article for credibility and accuracy.

Article to analyze:
${articleText}

Please provide a comprehensive fact-check analysis in the following JSON format:

{
  "credibilityScore": [number between 0-100],
  "summary": "[2-3 sentence summary of your analysis]",
  "analysisFactors": [
    "[factor 1 with ✅/⚠️/❌ emoji]",
    "[factor 2 with ✅/⚠️/❌ emoji]",
    "[factor 3 with ✅/⚠️/❌ emoji]"
  ],
  "claimsAnalyzed": [
    {
      "claim": "[specific claim from the article]",
      "verdict": "[true/false/partially true/unverified]",
      "explanation": "[brief explanation of your assessment]"
    }
  ]
}

Scoring Guidelines:
- 90-100: Highly credible, well-sourced, factually accurate
- 70-89: Generally credible with minor issues or missing context
- 50-69: Mixed credibility, some concerns or unverified claims
- 30-49: Low credibility, significant issues or misleading information
- 0-29: Very low credibility, false or highly misleading

Consider these factors:
1. Source reputation and reliability
2. Presence of verifiable facts and data
3. Use of proper attribution and sourcing
4. Language tone (sensationalist vs. factual)
5. Logical consistency and plausibility
6. Potential bias or agenda
7. Timeliness and relevance of information
8. Cross-verification with known facts

Respond ONLY with valid JSON, no additional text.`

    const result = await generateText({
      model: xai("grok-beta"),
      prompt,
      temperature: 0.3, // Lower temperature for more consistent analysis
    })

    console.log("🤖 Raw Grok response:", result.text)

    // Parse the JSON response
    let parsedResult: GrokFactCheckResult
    try {
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = result.text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()

      parsedResult = JSON.parse(cleanedResponse)
    } catch (parseError) {
      console.error("❌ Failed to parse Grok response as JSON:", parseError)
      console.log("Raw response:", result.text)

      // Fallback analysis if JSON parsing fails
      return createFallbackAnalysis(title, content, result.text)
    }

    // Validate the parsed result
    if (!parsedResult.credibilityScore || !parsedResult.summary) {
      console.error("❌ Invalid Grok response structure")
      return createFallbackAnalysis(title, content, result.text)
    }

    // Ensure credibility score is within valid range
    parsedResult.credibilityScore = Math.max(0, Math.min(100, parsedResult.credibilityScore))

    // Ensure we have analysis factors
    if (!parsedResult.analysisFactors || parsedResult.analysisFactors.length === 0) {
      parsedResult.analysisFactors = ["🤖 Analysis completed by Grok AI"]
    }

    // Ensure we have claims analyzed
    if (!parsedResult.claimsAnalyzed || parsedResult.claimsAnalyzed.length === 0) {
      parsedResult.claimsAnalyzed = [
        {
          claim: "Overall article content",
          verdict:
            parsedResult.credibilityScore >= 70
              ? "true"
              : parsedResult.credibilityScore >= 40
                ? "partially true"
                : "false",
          explanation: "General assessment based on content analysis",
        },
      ]
    }

    console.log("✅ Grok analysis complete:", {
      score: parsedResult.credibilityScore,
      factorsCount: parsedResult.analysisFactors.length,
      claimsCount: parsedResult.claimsAnalyzed.length,
    })

    return parsedResult
  } catch (error) {
    console.error("🚨 Error in Grok fact-check analysis:", error)

    // Return a fallback analysis
    return createFallbackAnalysis(title, content, `Error: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

function createFallbackAnalysis(title: string, content: string, errorInfo: string): GrokFactCheckResult {
  // Create a basic content analysis as fallback
  const text = (title + " " + content).toLowerCase()
  let score = 50 // Start neutral

  const factors: string[] = []

  // Basic content analysis
  if (text.includes("according to") || text.includes("sources say") || text.includes("reported")) {
    score += 10
    factors.push("✅ Contains source attribution")
  }

  if (text.includes("shocking") || text.includes("unbelievable") || text.includes("secret")) {
    score -= 15
    factors.push("❌ Uses sensationalist language")
  }

  if (text.includes("study") || text.includes("research") || text.includes("data")) {
    score += 8
    factors.push("✅ References research or data")
  }

  if (text.includes("allegedly") || text.includes("reportedly") || text.includes("rumored")) {
    score -= 5
    factors.push("⚠️ Contains unverified claims")
  }

  // Check for reputable sources
  if (text.includes("reuters") || text.includes("bloomberg") || text.includes("associated press")) {
    score += 15
    factors.push("✅ Reputable news source")
  }

  factors.push("⚠️ Fallback analysis used due to technical issues")

  score = Math.max(0, Math.min(100, score))

  return {
    credibilityScore: score,
    summary: `Fallback analysis indicates ${score >= 70 ? "good" : score >= 40 ? "mixed" : "low"} credibility. Manual verification recommended due to technical limitations.`,
    analysisFactors: factors,
    claimsAnalyzed: [
      {
        claim: "Article content analysis",
        verdict: score >= 70 ? "true" : score >= 40 ? "partially true" : "unverified",
        explanation: "Basic content pattern analysis performed as fallback",
      },
    ],
  }
}

// Alternative function for quick credibility checks
export async function quickCredibilityCheck(headline: string): Promise<number> {
  try {
    const prompt = `As a fact-checking expert, analyze this news headline for credibility and provide ONLY a number between 0-100 representing the credibility score:

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
    })

    const score = Number.parseInt(result.text.trim())

    if (isNaN(score) || score < 0 || score > 100) {
      console.error("Invalid score from Grok:", result.text)
      return 50 // Default neutral score
    }

    return score
  } catch (error) {
    console.error("Error in quick credibility check:", error)
    return 50 // Default neutral score
  }
}

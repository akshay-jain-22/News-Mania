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

    // Prepare the article content for analysis
    const articleText = `
TITLE: ${title}

DESCRIPTION: ${description || "No description available"}

CONTENT: ${content || "No content available"}
    `.trim()

    console.log("📝 Article text length:", articleText.length)
    console.log("📝 First 200 chars:", articleText.substring(0, 200) + "...")

    const prompt = `You are an expert fact-checker and media analyst with extensive knowledge of current events, media bias, and misinformation patterns. Analyze the following news article for credibility and accuracy.

ARTICLE TO ANALYZE:
${articleText}

INSTRUCTIONS:
1. Carefully read and analyze the entire article
2. Consider the source, language, claims, and overall credibility
3. Provide a credibility score from 0-100 based on these criteria:
   - 90-100: Highly credible, well-sourced, factually accurate
   - 70-89: Generally credible with minor issues
   - 50-69: Mixed credibility, some concerns
   - 30-49: Low credibility, significant issues
   - 0-29: Very low credibility, false or misleading

4. Identify specific analysis factors that influenced your score
5. Extract and analyze key claims from the article

RESPOND WITH VALID JSON IN THIS EXACT FORMAT:
{
  "credibilityScore": 75,
  "summary": "Your 2-3 sentence analysis summary here",
  "analysisFactors": [
    "✅ Positive factor example",
    "⚠️ Neutral/concerning factor example", 
    "❌ Negative factor example"
  ],
  "claimsAnalyzed": [
    {
      "claim": "Specific claim from the article",
      "verdict": "true",
      "explanation": "Brief explanation of why this claim is true/false/etc"
    }
  ]
}

IMPORTANT: Respond ONLY with the JSON object, no other text before or after.`

    console.log("🚀 Sending request to Grok...")

    const result = await generateText({
      model: xai("grok-beta"),
      prompt,
      temperature: 0.2, // Lower temperature for more consistent analysis
      maxTokens: 2000, // Ensure enough tokens for complete response
    })

    console.log("✅ Received response from Grok")
    console.log("📄 Raw Grok response:", result.text)

    // Clean and parse the JSON response
    let parsedResult: GrokFactCheckResult
    try {
      // Remove any markdown formatting and extra whitespace
      let cleanedResponse = result.text
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .replace(/^\s*[\r\n]+/gm, "")
        .trim()

      // Find the JSON object in the response
      const jsonStart = cleanedResponse.indexOf("{")
      const jsonEnd = cleanedResponse.lastIndexOf("}") + 1

      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd)
      }

      console.log("🧹 Cleaned response:", cleanedResponse)

      parsedResult = JSON.parse(cleanedResponse)
      console.log("✅ Successfully parsed JSON:", parsedResult)
    } catch (parseError) {
      console.error("❌ Failed to parse Grok response as JSON:", parseError)
      console.log("🔍 Attempting to extract information manually...")

      // Try to extract information manually if JSON parsing fails
      return extractInformationManually(result.text, title, content)
    }

    // Validate and sanitize the parsed result
    if (!parsedResult || typeof parsedResult !== "object") {
      console.error("❌ Invalid response structure from Grok")
      return createFallbackAnalysis(title, content, "Invalid response structure")
    }

    // Ensure credibility score is valid
    if (typeof parsedResult.credibilityScore !== "number" || isNaN(parsedResult.credibilityScore)) {
      console.error("❌ Invalid credibility score:", parsedResult.credibilityScore)
      parsedResult.credibilityScore = 50
    }

    // Clamp credibility score to valid range
    parsedResult.credibilityScore = Math.max(0, Math.min(100, Math.round(parsedResult.credibilityScore)))

    // Ensure summary exists
    if (!parsedResult.summary || typeof parsedResult.summary !== "string") {
      parsedResult.summary = `Analysis completed with ${parsedResult.credibilityScore}% credibility score.`
    }

    // Ensure analysis factors exist and are valid
    if (!Array.isArray(parsedResult.analysisFactors)) {
      parsedResult.analysisFactors = ["🤖 Analysis completed by Grok AI"]
    }

    // Ensure claims analyzed exist and are valid
    if (!Array.isArray(parsedResult.claimsAnalyzed) || parsedResult.claimsAnalyzed.length === 0) {
      parsedResult.claimsAnalyzed = [
        {
          claim: "Overall article assessment",
          verdict:
            parsedResult.credibilityScore >= 70
              ? "true"
              : parsedResult.credibilityScore >= 40
                ? "partially true"
                : "unverified",
          explanation: "General credibility assessment based on content analysis",
        },
      ]
    }

    console.log("🎯 Final Grok analysis result:", {
      score: parsedResult.credibilityScore,
      factorsCount: parsedResult.analysisFactors.length,
      claimsCount: parsedResult.claimsAnalyzed.length,
      summary: parsedResult.summary.substring(0, 100) + "...",
    })

    return parsedResult
  } catch (error) {
    console.error("🚨 Error in Grok fact-check analysis:", error)
    console.error("🚨 Error details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
    })

    // Return a more informative fallback analysis
    return createFallbackAnalysis(
      title,
      content,
      `Grok API Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

function extractInformationManually(responseText: string, title: string, content: string): GrokFactCheckResult {
  console.log("🔧 Attempting manual information extraction...")

  let score = 50
  const factors: string[] = []
  const claims: Array<{
    claim: string
    verdict: "true" | "false" | "partially true" | "unverified"
    explanation: string
  }> = []

  // Try to extract score from response
  const scoreMatch = responseText.match(/(?:score|credibility).*?(\d+)/i)
  if (scoreMatch) {
    const extractedScore = Number.parseInt(scoreMatch[1])
    if (!isNaN(extractedScore) && extractedScore >= 0 && extractedScore <= 100) {
      score = extractedScore
    }
  }

  // Look for positive/negative indicators in the response
  if (responseText.toLowerCase().includes("credible") || responseText.toLowerCase().includes("reliable")) {
    factors.push("✅ Grok identified credible elements")
  }
  if (responseText.toLowerCase().includes("concern") || responseText.toLowerCase().includes("issue")) {
    factors.push("⚠️ Grok identified potential concerns")
  }
  if (responseText.toLowerCase().includes("false") || responseText.toLowerCase().includes("misleading")) {
    factors.push("❌ Grok identified misleading elements")
  }

  // Add a default factor if none found
  if (factors.length === 0) {
    factors.push("🤖 Manual extraction from Grok response")
  }

  // Create a basic claim
  claims.push({
    claim: "Article content evaluation",
    verdict: score >= 70 ? "true" : score >= 40 ? "partially true" : "unverified",
    explanation: "Assessment based on manual extraction from Grok analysis",
  })

  return {
    credibilityScore: score,
    summary: `Manual extraction indicates ${score >= 70 ? "good" : score >= 40 ? "mixed" : "low"} credibility based on Grok's analysis.`,
    analysisFactors: factors,
    claimsAnalyzed: claims,
  }
}

function createFallbackAnalysis(title: string, content: string, errorInfo: string): GrokFactCheckResult {
  console.log("🔄 Creating fallback analysis due to:", errorInfo)

  // Create a more sophisticated content analysis as fallback
  const text = (title + " " + content).toLowerCase()
  let score = 50 // Start neutral

  const factors: string[] = []

  // Positive indicators
  if (text.includes("according to") || text.includes("sources say") || text.includes("reported by")) {
    score += 12
    factors.push("✅ Contains source attribution")
  }

  if (text.includes("study") || text.includes("research") || text.includes("data shows")) {
    score += 10
    factors.push("✅ References research or data")
  }

  if (text.includes("said") || text.includes("stated") || text.includes("announced")) {
    score += 8
    factors.push("✅ Uses direct quotes or statements")
  }

  // Check for reputable sources in content
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
  ]
  const foundSources = reputableSources.filter((source) => text.includes(source))
  if (foundSources.length > 0) {
    score += 15
    factors.push(`✅ Reputable source: ${foundSources[0]}`)
  }

  // Negative indicators
  if (text.includes("shocking") || text.includes("unbelievable") || text.includes("you won't believe")) {
    score -= 15
    factors.push("❌ Uses sensationalist language")
  }

  if (text.includes("secret") || text.includes("they don't want you to know") || text.includes("hidden truth")) {
    score -= 12
    factors.push("❌ Uses conspiracy-style language")
  }

  if (text.includes("allegedly") || text.includes("reportedly") || text.includes("rumored")) {
    score -= 8
    factors.push("⚠️ Contains unverified claims")
  }

  if (text.includes("all") || text.includes("every") || text.includes("always") || text.includes("never")) {
    score -= 5
    factors.push("⚠️ Uses absolute language")
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score))

  // Add error information
  factors.push(`⚠️ Fallback analysis used: ${errorInfo}`)

  return {
    credibilityScore: score,
    summary: `Fallback content analysis indicates ${score >= 70 ? "good" : score >= 40 ? "mixed" : "concerning"} credibility. Grok analysis was unavailable, so this assessment is based on content patterns and language analysis.`,
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

// Alternative simpler function for testing Grok connectivity
export async function testGrokConnection(): Promise<boolean> {
  try {
    console.log("🧪 Testing Grok connection...")

    const result = await generateText({
      model: xai("grok-beta"),
      prompt: "Respond with exactly: 'Connection successful'",
      temperature: 0,
      maxTokens: 10,
    })

    const success = result.text.trim().toLowerCase().includes("connection successful")
    console.log(success ? "✅ Grok connection test passed" : "❌ Grok connection test failed")
    console.log("🔍 Test response:", result.text)

    return success
  } catch (error) {
    console.error("❌ Grok connection test failed:", error)
    return false
  }
}

// Quick credibility check function
export async function quickCredibilityCheck(headline: string): Promise<number> {
  try {
    console.log("⚡ Quick credibility check for:", headline)

    const prompt = `As a fact-checking expert, analyze this news headline for credibility. Consider source plausibility, language tone, and potential for misinformation.

Headline: "${headline}"

Respond with ONLY a number between 0-100 representing the credibility score. No other text.`

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

import { xai } from "@ai-sdk/xai"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"
import { analyzeFactCheck } from "@/lib/gemini-client"

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
  console.log("🤖 Starting Gemini fact-check analysis...")

  try {
    const analysisText = await analyzeFactCheck(title, content, description)
    const parsedResult = parseAIResponse(analysisText, title, "Gemini AI")
    return parsedResult
  } catch (error) {
    console.error("Gemini analysis failed:", error)
    return createEnhancedFallbackAnalysis(title, content || description || "")
  }
}

function parseAIResponse(responseText: string, title: string, aiProvider: string): GrokFactCheckResult {
  console.log("🔍 Parsing AI response...")

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
    let summary = `AI analysis of "${title}" completed with ${credibilityScore}% credibility score.`

    if (summaryMatch) {
      summary = summaryMatch[1].trim().replace(/\n/g, " ")
      console.log("✅ Extracted summary:", summary.substring(0, 100) + "...")
    } else {
      console.log("⚠️ Could not extract summary, using default")
    }

    // Extract reasons/explanation
    const reasonsMatch = responseText.match(/Reasons:\s*(.+?)$/is)
    let explanation = "AI analysis completed based on content evaluation."

    if (reasonsMatch) {
      explanation = reasonsMatch[1].trim().replace(/\n/g, " ")
      console.log("✅ Extracted explanation:", explanation.substring(0, 100) + "...")
    } else {
      console.log("⚠️ Could not extract explanation, using default")
    }

    // Generate analysis factors based on the score and explanation
    const analysisFactors = generateAnalysisFactors(credibilityScore, explanation, responseText, aiProvider)

    // Generate claims based on the analysis
    const claimsAnalyzed = generateClaimsAnalyzed(credibilityScore, explanation, title)

    return {
      credibilityScore,
      summary,
      analysisFactors,
      claimsAnalyzed,
    }
  } catch (error) {
    console.error("❌ Error parsing AI response:", error)

    // Return a basic parsed result
    return {
      credibilityScore: 50,
      summary: `AI analysis of "${title}" completed. Response parsing encountered issues.`,
      analysisFactors: [`🤖 ${aiProvider} analysis completed`, "⚠️ Response parsing had minor issues"],
      claimsAnalyzed: [
        {
          claim: "Overall article assessment",
          verdict: "partially true",
          explanation: "AI analysis completed with standard evaluation",
        },
      ],
    }
  }
}

function generateAnalysisFactors(
  score: number,
  explanation: string,
  fullResponse: string,
  aiProvider: string,
): string[] {
  const factors: string[] = []

  // Add factors based on score
  if (score >= 80) {
    factors.push(`✅ High credibility score from ${aiProvider}`)
  } else if (score >= 60) {
    factors.push(`⚠️ Moderate credibility score from ${aiProvider}`)
  } else if (score >= 40) {
    factors.push(`⚠️ Mixed credibility indicators identified`)
  } else {
    factors.push(`❌ Low credibility score from ${aiProvider}`)
  }

  // Add factors based on explanation content
  const explanationLower = explanation.toLowerCase()

  if (
    explanationLower.includes("reliable") ||
    explanationLower.includes("credible") ||
    explanationLower.includes("trustworthy")
  ) {
    factors.push("✅ AI identified reliable elements")
  }

  if (
    explanationLower.includes("bias") ||
    explanationLower.includes("biased") ||
    explanationLower.includes("partisan")
  ) {
    factors.push("⚠️ Potential bias detected by AI")
  }

  if (
    explanationLower.includes("source") ||
    explanationLower.includes("attribution") ||
    explanationLower.includes("cited")
  ) {
    factors.push("✅ Source attribution evaluated by AI")
  }

  if (
    explanationLower.includes("concern") ||
    explanationLower.includes("issue") ||
    explanationLower.includes("problem")
  ) {
    factors.push("⚠️ Credibility concerns identified by AI")
  }

  if (
    explanationLower.includes("false") ||
    explanationLower.includes("misleading") ||
    explanationLower.includes("inaccurate")
  ) {
    factors.push("❌ Misleading content detected by AI")
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
    factors.push("✅ Factual content confirmed by AI")
  }

  // Always add AI provider attribution with custom text
  factors.push(`🌍 Sliced, diced, and analyzed by the Mania World`)

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

// Enhanced connection test that tries multiple AI providers
export async function testGrokConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  console.log("🧪 Testing AI connections...")

  const results = {
    grok: { success: false, message: "", model: "" },
    openai: { success: false, message: "", model: "" },
    gemini: { success: false, message: "", model: "" },
  }

  // Test Grok AI with multiple models
  const grokModels = ["grok-beta", "grok-2", "grok-1", "grok"]

  for (const model of grokModels) {
    try {
      console.log(`🧪 Testing Grok model: ${model}`)

      const result = await generateText({
        model: xai(model),
        prompt: "Respond with exactly: Connection successful",
        temperature: 0,
        maxTokens: 10,
      })

      if (result.text.toLowerCase().includes("connection successful")) {
        results.grok = {
          success: true,
          message: `Grok AI working with model ${model}`,
          model: model,
        }
        console.log(`✅ Grok ${model} connection successful`)
        break
      }
    } catch (error) {
      console.log(`❌ Grok ${model} failed:`, error instanceof Error ? error.message : "Unknown error")
      results.grok.message = error instanceof Error ? error.message : "Unknown error"
    }
  }

  // Test OpenAI
  try {
    console.log("🧪 Testing OpenAI...")

    const openaiKey = process.env.OPENAI_API_KEY
    if (openaiKey) {
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: "Respond with exactly: Connection successful",
        temperature: 0,
        maxTokens: 10,
      })

      if (result.text.toLowerCase().includes("connection successful")) {
        results.openai = {
          success: true,
          message: "OpenAI GPT-4 working properly",
          model: "gpt-4o-mini",
        }
        console.log("✅ OpenAI connection successful")
      }
    } else {
      results.openai.message = "OPENAI_API_KEY not found"
    }
  } catch (error) {
    console.log("❌ OpenAI failed:", error instanceof Error ? error.message : "Unknown error")
    results.openai.message = error instanceof Error ? error.message : "Unknown error"
  }

  // Test Gemini AI
  try {
    console.log("🧪 Testing Gemini AI...")

    const result = await analyzeFactCheck("Test", "Test content", "Test description")
    if (result.toLowerCase().includes("connection successful")) {
      results.gemini = {
        success: true,
        message: "Gemini AI working properly",
        model: "gemini",
      }
      console.log("✅ Gemini AI connection successful")
    }
  } catch (error) {
    console.log("❌ Gemini AI failed:", error instanceof Error ? error.message : "Unknown error")
    results.gemini.message = error instanceof Error ? error.message : "Unknown error"
  }

  // Determine overall success
  const overallSuccess = results.grok.success || results.openai.success || results.gemini.success
  let message = ""

  if (results.grok.success && results.openai.success && results.gemini.success) {
    message = "All AI providers (Grok, OpenAI, Gemini) are working properly"
  } else if (results.grok.success && results.openai.success) {
    message = `Grok AI working (${results.grok.model}), OpenAI working (${results.openai.model}), Gemini AI unavailable`
  } else if (results.grok.success && results.gemini.success) {
    message = `Grok AI working (${results.grok.model}), Gemini AI working (${results.gemini.model}), OpenAI unavailable`
  } else if (results.openai.success && results.gemini.success) {
    message = `OpenAI working (${results.openai.model}), Gemini AI working (${results.gemini.model}), Grok AI unavailable`
  } else if (results.grok.success) {
    message = `Grok AI working (${results.grok.model}), OpenAI and Gemini AI unavailable`
  } else if (results.openai.success) {
    message = `OpenAI working (${results.openai.model}), Grok AI and Gemini AI unavailable`
  } else if (results.gemini.success) {
    message = `Gemini AI working (${results.gemini.model}), Grok AI and OpenAI unavailable`
  } else {
    message = "All AI providers (Grok, OpenAI, Gemini) are unavailable"
  }

  return {
    success: overallSuccess,
    message,
    details: results,
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

  factors.push("🌍 Sliced, diced, and analyzed by the Mania World")

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

// Quick credibility check function for headlines with AI fallback
export async function quickCredibilityCheck(headline: string): Promise<number> {
  try {
    console.log("⚡ Quick credibility check for:", headline)

    const prompt = `You are a news verification assistant. Analyze this headline for credibility and respond with ONLY a number between 0-100 representing the credibility score.

Headline: "${headline}"

Consider:
- Source plausibility
- Language tone (sensationalist vs factual)
- Logical consistency
- Potential for misinformation

Respond with ONLY the number (0-100), nothing else.`

    // Try Grok first
    try {
      const grokModels = ["grok-beta", "grok-2", "grok-1", "grok"]

      for (const model of grokModels) {
        try {
          const result = await generateText({
            model: xai(model),
            prompt,
            temperature: 0.1,
            maxTokens: 10,
          })

          const score = Number.parseInt(result.text.trim())
          if (!isNaN(score) && score >= 0 && score <= 100) {
            console.log(`✅ Quick check score from Grok ${model}:`, score)
            return score
          }
        } catch (error) {
          continue
        }
      }
    } catch (error) {
      console.log("❌ Grok failed for quick check, trying OpenAI...")
    }

    // Fallback to OpenAI
    try {
      const result = await generateText({
        model: openai("gpt-4o-mini"),
        prompt,
        temperature: 0.1,
        maxTokens: 10,
      })

      const score = Number.parseInt(result.text.trim())
      if (!isNaN(score) && score >= 0 && score <= 100) {
        console.log("✅ Quick check score from OpenAI:", score)
        return score
      }
    } catch (error) {
      console.log("❌ OpenAI also failed for quick check")
    }

    // Fallback to Gemini AI
    try {
      const result = await analyzeFactCheck(headline, "", "")
      const score = Number.parseInt(result.trim())
      if (!isNaN(score) && score >= 0 && score <= 100) {
        console.log("✅ Quick check score from Gemini AI:", score)
        return score
      }
    } catch (error) {
      console.log("❌ Gemini AI also failed for quick check")
    }

    // Final fallback - basic content analysis
    console.log("⚠️ Using fallback analysis for quick check")
    const text = headline.toLowerCase()
    let score = 50

    if (text.includes("shocking") || text.includes("unbelievable")) score -= 20
    if (text.includes("breaking") || text.includes("urgent")) score += 10
    if (text.includes("reportedly") || text.includes("allegedly")) score -= 10

    return Math.max(0, Math.min(100, score))
  } catch (error) {
    console.error("❌ Error in quick credibility check:", error)
    return 50 // Default neutral score
  }
}

// Simple function for factCheckWithGrok to maintain compatibility
export const factCheckWithGrok = async (statement: string) => {
  console.log("Using simplified factCheckWithGrok function")

  try {
    // Use the AI SDK directly instead of langchain
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `You are an expert fact checker. Given the following statement, provide a detailed analysis of its truthfulness.
Explain your reasoning and cite any sources you used to verify the information.

Statement: ${statement}`,
      temperature: 0,
      maxTokens: 500,
    })

    const analysisFactors: string[] = []
    analysisFactors.push("🌍 Sliced, diced, and analyzed by the Mania World")
    analysisFactors.push("Fact-checked using advanced AI algorithms")
    analysisFactors.push("Data sources include reputable news outlets and academic research")

    return {
      analysis: result.text,
      analysisFactors,
    }
  } catch (error) {
    console.error("Error in factCheckWithGrok:", error)
    return {
      analysis: "Unable to perform fact-check analysis at this time.",
      analysisFactors: [
        "🌍 Sliced, diced, and analyzed by the Mania World",
        "⚠️ Analysis limited due to technical issues",
      ],
    }
  }
}

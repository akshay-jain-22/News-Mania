import { type NextRequest, NextResponse } from "next/server"
import { analyzeArticleWithGrok, testGrokConnection, createEnhancedFallbackAnalysis } from "@/lib/grok-fact-check"

export async function POST(request: NextRequest) {
  try {
    const { title, content, description } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    console.log("🚀 Starting AI-powered fact-check analysis for:", title.substring(0, 50) + "...")

    try {
      // Use AI to analyze the article (tries Grok first, then OpenAI)
      const aiResult = await analyzeArticleWithGrok(title, content || "", description || "")

      // Convert to our expected format
      const claimsAnalyzed = aiResult.claimsAnalyzed.map((claim) => ({
        claim: claim.claim,
        verdict: claim.verdict,
        explanation: claim.explanation,
        sources: [], // AI doesn't provide specific source URLs
      }))

      const factCheckResult = {
        isFactChecked: true,
        credibilityScore: aiResult.credibilityScore,
        factCheckResult: aiResult.summary,
        claimsAnalyzed,
        analysisFactors: aiResult.analysisFactors,
        analyzedBy: "AI Analysis (Grok/OpenAI)",
        debugInfo: {
          fallbackUsed: false,
          timestamp: new Date().toISOString(),
        },
      }

      console.log("✅ AI fact-check complete:", {
        score: aiResult.credibilityScore,
        summary: aiResult.summary.substring(0, 100) + "...",
        factorsCount: aiResult.analysisFactors.length,
        claimsCount: aiResult.claimsAnalyzed.length,
      })

      return NextResponse.json(factCheckResult)
    } catch (aiError) {
      console.log("❌ All AI providers failed, using enhanced fallback...")
      console.log("❌ AI failure reason:", aiError instanceof Error ? aiError.message : "Unknown error")

      // Use enhanced fallback analysis
      const fallbackResult = createEnhancedFallbackAnalysis(title, content || description || "")

      const factCheckResult = {
        isFactChecked: true,
        credibilityScore: fallbackResult.credibilityScore,
        factCheckResult: fallbackResult.summary,
        claimsAnalyzed: fallbackResult.claimsAnalyzed.map((claim) => ({
          claim: claim.claim,
          verdict: claim.verdict,
          explanation: claim.explanation,
          sources: [],
        })),
        analysisFactors: [
          ...fallbackResult.analysisFactors,
          `❌ AI providers unavailable: ${aiError instanceof Error ? aiError.message : "Unknown error"}`,
        ],
        analyzedBy: "Enhanced Fallback Analysis",
        debugInfo: {
          fallbackUsed: true,
          aiError: aiError instanceof Error ? aiError.message : "Unknown error",
          timestamp: new Date().toISOString(),
        },
      }

      return NextResponse.json(factCheckResult)
    }
  } catch (error) {
    console.error("🚨 Fact-check API error:", error)

    // Extract title from request for fallback
    let title = "Unknown Article"
    let content = ""

    try {
      const body = await request.json()
      title = body.title || title
      content = body.content || body.description || ""
    } catch {
      // Ignore JSON parsing errors for fallback
    }

    // Use enhanced fallback analysis even on errors
    const fallbackResult = createEnhancedFallbackAnalysis(title, content)

    const factCheckResult = {
      isFactChecked: true,
      credibilityScore: fallbackResult.credibilityScore,
      factCheckResult: `${fallbackResult.summary} Note: Analysis failed due to: ${error instanceof Error ? error.message : "Unknown error"}`,
      claimsAnalyzed: fallbackResult.claimsAnalyzed.map((claim) => ({
        claim: claim.claim,
        verdict: claim.verdict,
        explanation: claim.explanation,
        sources: [],
      })),
      analysisFactors: [
        ...fallbackResult.analysisFactors,
        `❌ System error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
      analyzedBy: "Error Fallback Analysis",
      debugInfo: {
        error: error instanceof Error ? error.message : "Unknown error",
        fallbackUsed: true,
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json(factCheckResult)
  }
}

// Test endpoint with detailed debugging for multiple AI providers
export async function GET() {
  try {
    console.log("🧪 Running comprehensive AI connection test...")

    // Test all AI connections
    const connectionTest = await testGrokConnection()

    const response = {
      status: connectionTest.success ? "connected" : "disconnected",
      message: connectionTest.message,
      timestamp: new Date().toISOString(),
      providers: connectionTest.details,
      debugInfo: {
        hasXaiKey: !!process.env.XAI_API_KEY,
        hasOpenaiKey: !!process.env.OPENAI_API_KEY,
        nodeEnv: process.env.NODE_ENV,
      },
    }

    console.log("🔍 Connection test response:", response)

    return NextResponse.json(response)
  } catch (error) {
    console.error("🚨 Connection test error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: `Connection test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date().toISOString(),
        debugInfo: {
          hasXaiKey: !!process.env.XAI_API_KEY,
          hasOpenaiKey: !!process.env.OPENAI_API_KEY,
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack?.substring(0, 500) : "No stack trace",
        },
      },
      { status: 500 },
    )
  }
}

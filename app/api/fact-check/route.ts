import { type NextRequest, NextResponse } from "next/server"
import { analyzeArticleWithGrok, testGrokConnection, createEnhancedFallbackAnalysis } from "@/lib/grok-fact-check"

export async function POST(request: NextRequest) {
  try {
    const { title, content, description } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    console.log("🚀 Starting fact-check analysis for:", title.substring(0, 50) + "...")

    // First, test the connection with detailed logging
    console.log("🧪 Testing Grok AI connection...")
    const connectionTest = await testGrokConnection()

    console.log("🔍 Connection test result:", connectionTest)

    if (!connectionTest.success) {
      console.log("❌ Grok AI connection failed, using enhanced fallback...")
      console.log("❌ Connection failure reason:", connectionTest.message)

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
        analysisFactors: [...fallbackResult.analysisFactors, `❌ Grok AI unavailable: ${connectionTest.message}`],
        analyzedBy: "Enhanced Fallback Analysis",
        debugInfo: {
          connectionTest: connectionTest,
          fallbackUsed: true,
          timestamp: new Date().toISOString(),
        },
      }

      return NextResponse.json(factCheckResult)
    }

    console.log("✅ Grok AI connection successful, proceeding with analysis...")

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
      debugInfo: {
        connectionTest: connectionTest,
        fallbackUsed: false,
        timestamp: new Date().toISOString(),
      },
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
      factCheckResult: `${fallbackResult.summary} Note: Grok AI analysis failed due to: ${error instanceof Error ? error.message : "Unknown error"}`,
      claimsAnalyzed: fallbackResult.claimsAnalyzed.map((claim) => ({
        claim: claim.claim,
        verdict: claim.verdict,
        explanation: claim.explanation,
        sources: [],
      })),
      analysisFactors: [
        ...fallbackResult.analysisFactors,
        `❌ Grok AI error: ${error instanceof Error ? error.message : "Unknown error"}`,
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

// Test endpoint with detailed debugging
export async function GET() {
  try {
    console.log("🧪 Running detailed connection test...")

    // Check environment variable
    const apiKey = process.env.XAI_API_KEY
    if (!apiKey) {
      console.error("❌ XAI_API_KEY not found in environment")
      return NextResponse.json(
        {
          status: "error",
          message: "XAI_API_KEY environment variable not found. Please configure your API key.",
          timestamp: new Date().toISOString(),
          hasApiKey: false,
          debugInfo: {
            envVars: Object.keys(process.env).filter((key) => key.includes("XAI") || key.includes("GROK")),
            nodeEnv: process.env.NODE_ENV,
          },
        },
        { status: 500 },
      )
    }

    console.log("✅ XAI_API_KEY found, length:", apiKey.length)

    // Test connection
    const connectionTest = await testGrokConnection()

    const response = {
      status: connectionTest.success ? "connected" : "disconnected",
      message: connectionTest.message,
      timestamp: new Date().toISOString(),
      hasApiKey: true,
      debugInfo: {
        ...connectionTest.details,
        apiKeyLength: apiKey.length,
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
        hasApiKey: !!process.env.XAI_API_KEY,
        debugInfo: {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack?.substring(0, 500) : "No stack trace",
        },
      },
      { status: 500 },
    )
  }
}

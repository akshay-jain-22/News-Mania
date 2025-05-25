import type { FactCheckResult, FactCheckClaim, NewsArticle } from "@/types/news"

// This is a mock implementation of a rumor detection service
// In a real application, you would use an AI service or fact-checking API

// Sample credibility indicators
const credibilityIndicators = [
  {
    pattern: /\b(breaking|exclusive|shocking)\b/i,
    impact: -5,
    reason: "Sensationalist language",
  },
  {
    pattern: /\b(allegedly|reportedly|sources say|anonymous source)\b/i,
    impact: -3,
    reason: "Unverified sources",
  },
  {
    pattern: /\b(study shows|research indicates|according to experts|data reveals)\b/i,
    impact: 5,
    reason: "Reference to research or experts",
  },
  {
    pattern: /\b(all|every|always|never|no one|everyone)\b/i,
    impact: -4,
    reason: "Absolute language",
  },
  {
    pattern: /\b(may|might|could|suggests|appears|seems)\b/i,
    impact: 3,
    reason: "Nuanced language",
  },
  {
    pattern: /\b(conspiracy|coverup|they don't want you to know|secret plan)\b/i,
    impact: -8,
    reason: "Conspiracy theory language",
  },
  {
    pattern: /\b(miracle|cure|revolutionary|breakthrough|game-changer)\b/i,
    impact: -6,
    reason: "Exaggerated claims",
  },
]

// Updated source trust scores with more detailed ratings
const sourceTrustScores: Record<string, number> = {
  Reuters: 92,
  "Associated Press": 91,
  "BBC News": 88,
  "The New York Times": 82,
  "The Washington Post": 81,
  "The Guardian": 80,
  NPR: 83,
  CNN: 72,
  "The Wall Street Journal": 84,
  Bloomberg: 83,
  "The Economist": 87,
  "Al Jazeera": 76,
  "USA Today": 70,
  "Fox News": 58,
  "Buzzfeed News": 65,
  "Daily Mail": 40,
  "The Sun": 35,
  "National Enquirer": 20,
  InfoWars: 10,
  Newsmania: 75, // Our own source
  "Unknown Source": 45, // Default for unknown sources
}

export async function analyzeArticleCredibility(article: NewsArticle): Promise<FactCheckResult> {
  // Simulate API delay for realism
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // Base score starts at 50 (neutral)
  let credibilityScore = 50
  const claimsAnalyzed: FactCheckClaim[] = []

  // 1. Check source credibility
  const sourceName = article.source.name
  if (sourceTrustScores[sourceName]) {
    const sourceImpact = (sourceTrustScores[sourceName] - 50) / 5
    credibilityScore += sourceImpact

    claimsAnalyzed.push({
      claim: `Source reliability: ${sourceName}`,
      verdict:
        sourceTrustScores[sourceName] >= 70 ? "true" : sourceTrustScores[sourceName] >= 50 ? "partially true" : "false",
      explanation: `${sourceName} has a trust score of ${sourceTrustScores[sourceName]}/100 based on historical accuracy and journalistic standards.`,
    })
  }

  // 2. Analyze content for credibility indicators
  const contentToAnalyze = `${article.title} ${article.description} ${article.content}`.toLowerCase()

  let foundIndicators = 0
  credibilityIndicators.forEach((indicator) => {
    if (indicator.pattern.test(contentToAnalyze)) {
      credibilityScore += indicator.impact
      foundIndicators++

      // Add as a claim if the impact is significant
      if (Math.abs(indicator.impact) >= 5) {
        claimsAnalyzed.push({
          claim: `Language analysis: ${indicator.reason}`,
          verdict: indicator.impact > 0 ? "true" : "partially true",
          explanation: `The article contains language patterns associated with ${
            indicator.impact > 0 ? "credible" : "less credible"
          } reporting: "${indicator.pattern.toString().replace(/\/(.*)\/i/, "$1")}"`,
        })
      }
    }
  })

  // 3. Check for balanced reporting (more sophisticated simulation)
  // Use title and content length as a proxy for depth
  const contentLength = article.content.length
  const hasDetailedContent = contentLength > 500
  const hasMultiplePerspectives =
    contentToAnalyze.includes("however") ||
    contentToAnalyze.includes("on the other hand") ||
    contentToAnalyze.includes("critics say") ||
    (contentToAnalyze.includes("according to") && contentToAnalyze.includes("while"))

  if (hasMultiplePerspectives) {
    credibilityScore += 15
    claimsAnalyzed.push({
      claim: "Multiple perspectives",
      verdict: "true",
      explanation: "The article presents multiple perspectives on the topic, showing balanced reporting.",
    })
  } else if (hasDetailedContent) {
    credibilityScore += 5
    claimsAnalyzed.push({
      claim: "Detailed reporting",
      verdict: "partially true",
      explanation: "The article provides detailed information but may not present all perspectives on the topic.",
    })
  } else {
    credibilityScore -= 10
    claimsAnalyzed.push({
      claim: "Limited perspective",
      verdict: "partially true",
      explanation: "The article presents a limited perspective and lacks depth on the topic.",
    })
  }

  // 4. Check for citation of sources (more sophisticated simulation)
  const citesSources =
    contentToAnalyze.includes("according to") ||
    contentToAnalyze.includes("said") ||
    contentToAnalyze.includes("reported") ||
    contentToAnalyze.includes("study") ||
    contentToAnalyze.includes("research") ||
    contentToAnalyze.includes("survey")

  const citesMultipleSources =
    (contentToAnalyze.match(/according to|said|reported|study|research|survey/g) || []).length > 2

  if (citesMultipleSources) {
    credibilityScore += 15
    claimsAnalyzed.push({
      claim: "Multiple sources cited",
      verdict: "true",
      explanation: "The article cites multiple specific sources for its claims, enhancing credibility.",
    })
  } else if (citesSources) {
    credibilityScore += 8
    claimsAnalyzed.push({
      claim: "Cites sources",
      verdict: "true",
      explanation: "The article cites specific sources for its claims.",
    })
  } else {
    credibilityScore -= 12
    claimsAnalyzed.push({
      claim: "Lack of sources",
      verdict: "false",
      explanation: "The article makes claims without citing specific sources, reducing credibility.",
    })
  }

  // 5. Check for clickbait title
  const hasClickbaitTitle =
    /you won't believe|shocking|mind-blowing|amazing|incredible|unbelievable|secret|trick|hack|this is why|here's why|the truth about|what they don't want you to know/i.test(
      article.title,
    )

  if (hasClickbaitTitle) {
    credibilityScore -= 15
    claimsAnalyzed.push({
      claim: "Clickbait title",
      verdict: "false",
      explanation:
        "The article uses sensationalist language in its title, which is often associated with less credible content.",
    })
  }

  // Ensure score is between 0 and 100
  credibilityScore = Math.max(0, Math.min(100, credibilityScore))

  // Generate overall assessment
  let factCheckResult: string

  if (credibilityScore < 30) {
    factCheckResult =
      "This article contains potentially misleading information. Multiple claims could not be verified, and the source has a history of inaccurate reporting. Readers should seek additional sources to verify the information presented."
  } else if (credibilityScore < 50) {
    factCheckResult =
      "This article contains some questionable claims and may lack proper context. The reporting shows signs of bias or incomplete information. Consider consulting additional sources for a more complete understanding."
  } else if (credibilityScore < 70) {
    factCheckResult =
      "This article contains some accurate information, but certain claims require additional context or verification. The source generally adheres to journalistic standards but may have some limitations in its reporting."
  } else if (credibilityScore < 90) {
    factCheckResult =
      "This article appears to be generally reliable, with most claims supported by evidence or credible sources. The reporting demonstrates good journalistic practices including balanced perspectives and proper sourcing."
  } else {
    factCheckResult =
      "This article appears to be highly reliable, with claims well-supported by evidence and credible sources. The reporting is thorough, balanced, and adheres to high journalistic standards."
  }

  return {
    isFactChecked: true,
    credibilityScore,
    factCheckResult,
    claimsAnalyzed,
  }
}

export async function checkFactClaimAgainstDatabase(claim: string): Promise<{
  verdict: "true" | "false" | "partially true" | "unverified"
  explanation: string
  sources?: string[]
}> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // In a real application, this would query a fact-checking database
  // For demo purposes, we'll return random results

  const verdicts: Array<"true" | "false" | "partially true" | "unverified"> = [
    "true",
    "false",
    "partially true",
    "unverified",
  ]

  const randomVerdict = verdicts[Math.floor(Math.random() * verdicts.length)]

  let explanation = ""
  let sources: string[] = []

  switch (randomVerdict) {
    case "true":
      explanation = `The claim "${claim}" has been verified as accurate by multiple fact-checking organizations.`
      sources = ["https://www.factcheck.org", "https://www.politifact.com", "https://www.snopes.com"]
      break
    case "false":
      explanation = `The claim "${claim}" has been debunked by fact-checkers and is not supported by evidence.`
      sources = ["https://www.factcheck.org", "https://www.politifact.com"]
      break
    case "partially true":
      explanation = `The claim "${claim}" contains some accurate elements but is missing important context or contains some inaccuracies.`
      sources = ["https://www.snopes.com", "https://www.reuters.com/fact-check"]
      break
    case "unverified":
      explanation = `The claim "${claim}" has not been verified by major fact-checking organizations yet.`
      break
  }

  return {
    verdict: randomVerdict,
    explanation,
    sources,
  }
}

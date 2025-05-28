"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function TestGrokPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [testText, setTestText] = useState(
    "Breaking: Scientists at MIT announce breakthrough in quantum computing. The new quantum processor can solve complex problems 1000 times faster than traditional computers. The research was published in Nature journal and peer-reviewed by leading experts.",
  )
  const { toast } = useToast()

  const runTest = async () => {
    if (!testText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some test text",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/fact-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: testText,
          content: testText,
          description: testText,
        }),
      })

      const data = await response.json()
      setResult(data)

      toast({
        title: "Test Complete",
        description: `Analysis by ${data.analyzedBy}`,
      })
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Grok AI Fact-Check Test</h1>
          <p className="text-muted-foreground mt-2">Test the Grok AI integration for fact-checking functionality</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Article</CardTitle>
            <CardDescription>Enter a news article or headline to test the fact-checking system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-text">Test Article/Headline</Label>
              <Textarea
                id="test-text"
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter news article or headline to test..."
                className="min-h-[100px]"
              />
            </div>

            <Button onClick={runTest} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing with Grok AI...
                </>
              ) : (
                "Run Fact-Check Test"
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Fact-Check Results
                <Badge variant="outline">{result.credibilityScore}%</Badge>
              </CardTitle>
              <CardDescription>Analysis by {result.analyzedBy}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Summary</h4>
                <p className="text-sm text-muted-foreground">{result.factCheckResult}</p>
              </div>

              {result.analysisFactors && result.analysisFactors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Analysis Factors</h4>
                  <ul className="space-y-1">
                    {result.analysisFactors.map((factor: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.claimsAnalyzed && result.claimsAnalyzed.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Claims Analyzed</h4>
                  <div className="space-y-2">
                    {result.claimsAnalyzed.map((claim: any, index: number) => (
                      <div key={index} className="p-3 bg-muted/50 rounded">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {claim.verdict}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{claim.claim}</p>
                        <p className="text-xs text-muted-foreground mt-1">{claim.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.debugInfo && (
                <div>
                  <h4 className="font-semibold mb-2">Debug Information</h4>
                  <pre className="text-xs bg-muted/50 p-3 rounded overflow-auto">
                    {JSON.stringify(result.debugInfo, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

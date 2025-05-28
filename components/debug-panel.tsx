"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Bug, CheckCircle, AlertTriangle, X, Copy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isTestingFactCheck, setIsTestingFactCheck] = useState(false)
  const [connectionResult, setConnectionResult] = useState<any>(null)
  const [factCheckResult, setFactCheckResult] = useState<any>(null)
  const [testArticle, setTestArticle] = useState(
    "NASA announces discovery of water on Mars. Scientists believe this could indicate potential for life on the red planet. The discovery was made using advanced spectroscopy techniques.",
  )
  const { toast } = useToast()

  const testConnection = async () => {
    setIsTestingConnection(true)
    setConnectionResult(null)

    try {
      console.log("🧪 Starting connection test...")
      const response = await fetch("/api/fact-check", { method: "GET" })
      const result = await response.json()
      setConnectionResult(result)

      console.log("🔍 Connection test result:", result)

      toast({
        title: result.status === "connected" ? "✅ Connection Success" : "❌ Connection Failed",
        description: result.message,
        variant: result.status === "connected" ? "default" : "destructive",
      })
    } catch (error) {
      const errorResult = {
        status: "error",
        message: `Network error: ${error instanceof Error ? error.message : "Unknown"}`,
        timestamp: new Date().toISOString(),
      }
      setConnectionResult(errorResult)

      toast({
        title: "❌ Test Failed",
        description: errorResult.message,
        variant: "destructive",
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const testFactCheck = async () => {
    if (!testArticle.trim()) {
      toast({
        title: "❌ Error",
        description: "Please enter a test article",
        variant: "destructive",
      })
      return
    }

    setIsTestingFactCheck(true)
    setFactCheckResult(null)

    try {
      console.log("🧪 Starting fact-check test...")
      const response = await fetch("/api/fact-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: testArticle,
          content: testArticle,
          description: testArticle,
        }),
      })

      const result = await response.json()
      setFactCheckResult(result)

      console.log("🔍 Fact-check test result:", result)

      toast({
        title: "✅ Fact Check Complete",
        description: `Score: ${result.credibilityScore}% by ${result.analyzedBy}`,
      })
    } catch (error) {
      const errorResult = {
        error: `Test failed: ${error instanceof Error ? error.message : "Unknown"}`,
      }
      setFactCheckResult(errorResult)

      toast({
        title: "❌ Test Failed",
        description: errorResult.error,
        variant: "destructive",
      })
    } finally {
      setIsTestingFactCheck(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "📋 Copied",
      description: "Debug info copied to clipboard",
    })
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={() => setIsOpen(true)} variant="outline" size="sm">
          <Bug className="h-4 w-4 mr-2" />
          Debug
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-y-auto">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Debug Panel</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-xs">Test Grok AI fact-checking functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Test */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Connection Test</Label>
            <Button onClick={testConnection} disabled={isTestingConnection} size="sm" className="w-full">
              {isTestingConnection ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Grok Connection"
              )}
            </Button>

            {connectionResult && (
              <div className="text-xs space-y-2 p-2 bg-muted/50 rounded">
                <div className="flex items-center gap-2">
                  {connectionResult.status === "connected" ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                  )}
                  <Badge
                    variant={connectionResult.status === "connected" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {connectionResult.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(connectionResult, null, 2))}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="text-muted-foreground">{connectionResult.message}</p>
                <div className="space-y-1">
                  <p>API Key: {connectionResult.hasApiKey ? "✅ Found" : "❌ Missing"}</p>
                  {connectionResult.debugInfo && (
                    <>
                      <p>API Key Length: {connectionResult.debugInfo.apiKeyLength || "N/A"}</p>
                      <p>Environment: {connectionResult.debugInfo.nodeEnv || "unknown"}</p>
                      {connectionResult.debugInfo.response && (
                        <p>Test Response: {connectionResult.debugInfo.response}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Fact Check Test */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Fact Check Test</Label>
            <Textarea
              value={testArticle}
              onChange={(e) => setTestArticle(e.target.value)}
              placeholder="Enter test article..."
              className="text-xs min-h-[60px]"
            />
            <Button onClick={testFactCheck} disabled={isTestingFactCheck} size="sm" className="w-full">
              {isTestingFactCheck ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Test Fact Check"
              )}
            </Button>

            {factCheckResult && (
              <div className="text-xs space-y-2 p-2 bg-muted/50 rounded">
                {factCheckResult.error ? (
                  <p className="text-red-600">{factCheckResult.error}</p>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {factCheckResult.credibilityScore}%
                      </Badge>
                      <span className="text-muted-foreground">{factCheckResult.analyzedBy}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(factCheckResult, null, 2))}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-muted-foreground">{factCheckResult.factCheckResult}</p>
                    <div className="space-y-1">
                      <p>Factors: {factCheckResult.analysisFactors?.length || 0}</p>
                      <p>Claims: {factCheckResult.claimsAnalyzed?.length || 0}</p>
                      {factCheckResult.debugInfo && (
                        <>
                          <p>Fallback Used: {factCheckResult.debugInfo.fallbackUsed ? "Yes" : "No"}</p>
                          <p>Timestamp: {new Date(factCheckResult.debugInfo.timestamp).toLocaleTimeString()}</p>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Environment Info */}
          <div className="text-xs text-muted-foreground border-t pt-2">
            <p>Environment: {process.env.NODE_ENV || "unknown"}</p>
            <p>Timestamp: {new Date().toLocaleTimeString()}</p>
            <p>User Agent: {navigator.userAgent.substring(0, 50)}...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

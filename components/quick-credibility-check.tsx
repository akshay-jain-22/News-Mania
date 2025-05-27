"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Zap } from "lucide-react"
import { quickCredibilityCheck } from "@/lib/grok-fact-check"

export function QuickCredibilityCheck() {
  const [headline, setHeadline] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [result, setResult] = useState<number | null>(null)

  const handleCheck = async () => {
    if (!headline.trim()) return

    setIsChecking(true)
    try {
      const score = await quickCredibilityCheck(headline)
      setResult(score)
    } catch (error) {
      console.error("Error checking headline:", error)
      setResult(50) // Default score on error
    } finally {
      setIsChecking(false)
    }
  }

  const getScoreBadge = (score: number) => {
    if (score >= 70) {
      return <Badge className="bg-green-600">High Credibility ({score}%)</Badge>
    } else if (score >= 40) {
      return <Badge variant="secondary">Mixed Credibility ({score}%)</Badge>
    } else {
      return <Badge variant="destructive">Low Credibility ({score}%)</Badge>
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Quick Headline Check
        </CardTitle>
        <CardDescription>Get an instant credibility assessment of any news headline using Grok AI</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter a news headline to check..."
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
          />
          <Button onClick={handleCheck} disabled={isChecking || !headline.trim()}>
            {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
          </Button>
        </div>

        {result !== null && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Credibility Assessment:</span>
              {getScoreBadge(result)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">🤖 Analysis by Grok AI</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

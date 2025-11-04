"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SummarizeDialogProps {
  articleId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SummarizeDialog({ articleId, open, onOpenChange }: SummarizeDialogProps) {
  const [loading, setLoading] = useState(false)
  const [length, setLength] = useState<"short" | "medium" | "long">("medium")
  const [summary, setSummary] = useState("")
  const [stage, setStage] = useState<"idle" | "fetching-context" | "generating" | "done">("idle")
  const [sources, setSources] = useState<Array<{ source: string; url: string; excerpt: string }>>([])
  const [fallbackUsed, setFallbackUsed] = useState(false)
  const [confidence, setConfidence] = useState<"High" | "Med" | "Low">("High")
  const [showProvenance, setShowProvenance] = useState(false)
  const { toast } = useToast()

  const handleSummarize = async () => {
    try {
      setLoading(true)
      setStage("fetching-context")

      const response = await fetch("/api/ml/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, length }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate summary")
      }

      setStage("generating")
      const data = await response.json()

      setSummary(data.summary)
      setSources(data.sources || [])
      setFallbackUsed(data.providerFallbackUsed || false)
      setConfidence(data.confidence || "Med")
      setStage("done")

      if (data.providerFallbackUsed) {
        toast({
          title: "Using alternate model",
          description: "Generated with Grok due to primary provider unavailability",
          duration: 3000,
        })
      }

      await fetch("/api/interactions/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          action: "summarize",
          resultRequestId: data.requestId,
          modelUsed: data.modelUsed,
          providerUsed: data.modelUsed?.split("/")[0],
          tokensUsed: data.tokensUsed,
        }),
      }).catch(console.error)
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate summary", variant: "destructive" })
      setStage("idle")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Summarize Article</DialogTitle>
          <DialogDescription>Select summary length and generate AI-powered summary</DialogDescription>
        </DialogHeader>

        {stage === "idle" && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {(["short", "medium", "long"] as const).map((l) => (
                <Button
                  key={l}
                  variant={length === l ? "default" : "outline"}
                  onClick={() => setLength(l)}
                  disabled={loading}
                  className="capitalize"
                >
                  {l}
                </Button>
              ))}
            </div>
            <Button onClick={handleSummarize} disabled={loading} className="w-full">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Generate Summary
            </Button>
          </div>
        )}

        {(stage === "fetching-context" || stage === "generating") && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {stage === "fetching-context" ? "Fetching context..." : "Generating summary..."}
            </p>
          </div>
        )}

        {stage === "done" && (
          <Tabs defaultValue="summary" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="provenance">Provenance</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              {fallbackUsed && (
                <div className="flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Using alternate model for this request</p>
                    <p className="text-xs">Generated with Grok due to primary provider unavailability</p>
                  </div>
                </div>
              )}

              <div className="rounded-md bg-slate-50 p-4">
                <p className="text-sm leading-relaxed text-slate-900">{summary}</p>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <span>Confidence: {confidence}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowProvenance(true)}>
                  View Sources
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="provenance" className="space-y-3">
              <p className="text-sm font-medium">Sources used in this summary:</p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {sources.map((source, idx) => (
                  <div key={idx} className="rounded-md border border-slate-200 p-3 text-sm">
                    <p className="font-medium text-slate-900">
                      [{idx + 1}] {source.source}
                    </p>
                    <p className="mt-1 text-slate-600 line-clamp-2">{source.excerpt}</p>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 text-xs text-blue-600 hover:underline"
                      >
                        Read full article →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

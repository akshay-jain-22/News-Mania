"use client"

import { useState } from "react"
import { NewsHeader } from "@/components/news-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { extractNewsFromUrl } from "@/lib/news-extractor"
import { Loader2, AlertCircle, CheckCircle2, LinkIcon, FileText, Newspaper } from "lucide-react"

export default function ExtractPage() {
  const [url, setUrl] = useState("")
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleExtract = async () => {
    setLoading(true)
    setError("")
    setSuccess(false)
    setResult(null)

    try {
      const extractedData = await extractNewsFromUrl(url)
      setResult(extractedData)
      setSuccess(true)
    } catch (err) {
      setError("Failed to extract news content. Please check the URL and try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleTextExtract = async () => {
    setLoading(true)
    setError("")
    setSuccess(false)
    setResult(null)

    try {
      // Process the text to extract news content
      const extractedData = {
        title: "Extracted from Text",
        content: text,
        summary: text.substring(0, 150) + "...",
        source: "Manual Input",
        date: new Date().toISOString(),
      }

      setResult(extractedData)
      setSuccess(true)
    } catch (err) {
      setError("Failed to process text content.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NewsHeader />

      <main className="flex-1 py-6">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Extract News</h1>
              <p className="text-muted-foreground">Extract news content from URLs or paste text directly</p>
            </div>

            <Tabs defaultValue="url" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">Extract from URL</TabsTrigger>
                <TabsTrigger value="text">Extract from Text</TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Extract News from URL</CardTitle>
                    <CardDescription>Enter a URL to extract news content from online sources</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="url"
                          placeholder="https://example.com/news-article"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleExtract} disabled={loading || !url}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Extracting...
                          </>
                        ) : (
                          <>
                            <Newspaper className="mr-2 h-4 w-4" />
                            Extract News
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="text" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Extract from Text</CardTitle>
                    <CardDescription>Paste news content directly to extract and analyze</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <Textarea
                        placeholder="Paste news content here..."
                        className="min-h-[200px]"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                      />
                      <Button onClick={handleTextExtract} disabled={loading || !text}>
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <FileText className="mr-2 h-4 w-4" />
                            Process Text
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && result && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <CardTitle>Extraction Successful</CardTitle>
                  </div>
                  <CardDescription>The news content has been successfully extracted</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{result.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Source: {result.source} • {new Date(result.date).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="rounded-md bg-muted p-4">
                      <h4 className="font-medium mb-2">Summary</h4>
                      <p>{result.summary}</p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Content</h4>
                      <div className="max-h-[300px] overflow-y-auto rounded-md border p-4">
                        <p>{result.content}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button>Save to Library</Button>
                      <Button variant="outline">Share</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

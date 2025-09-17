import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Send } from "lucide-react"

export default function AIChatPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">AI News Assistant</h1>
            <p className="text-muted-foreground">Get insights, summaries, and analysis of current news events</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Chat with AI
              </CardTitle>
              <CardDescription>
                Ask questions about current events, get news summaries, or request fact-checks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="min-h-[400px] border rounded-lg p-4 bg-muted/50">
                <div className="text-center text-muted-foreground">
                  Start a conversation to get AI-powered news insights
                </div>
              </div>

              <div className="flex gap-2">
                <Input placeholder="Ask about current news events..." className="flex-1" />
                <Button>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

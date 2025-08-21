"use client"

import { useState, useEffect } from "react"
import { MLPersonalizedFeed } from "@/components/ml-personalized-feed"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase-client"
import { Brain, Sparkles, Info, User } from "lucide-react"
import Link from "next/link"

export default function AIPersonalizedPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <Brain className="h-10 w-10 animate-pulse text-purple-500" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <Brain className="h-16 w-16 text-purple-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-4">AI Personalization Requires Account</h1>
              <p className="text-muted-foreground mb-6">
                Sign in to unlock AI-powered personalized news recommendations based on your reading habits and
                preferences.
              </p>
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Our AI learns from your reading patterns to provide increasingly accurate recommendations over time.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-4 justify-center">
                  <Link href="/auth">
                    <Button>
                      <User className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline">Browse News</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-900/10 to-blue-900/10 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Brain className="h-12 w-12 text-purple-500" />
              <Sparkles className="h-8 w-8 text-yellow-400" />
            </div>
            <h1 className="text-4xl font-bold mb-4">AI-Powered News Personalization</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience news like never before with machine learning that adapts to your interests, reading patterns,
              and preferences in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <MLPersonalizedFeed userId={user.id} />
      </div>
    </div>
  )
}

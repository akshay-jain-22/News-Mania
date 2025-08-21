"use client"

import { useState, useEffect } from "react"
import { NewsHeader } from "@/components/news-header"
import { MLPersonalizedFeed } from "@/components/ml-personalized-feed"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, Sparkles, User, TrendingUp, Zap, Info, ChevronRight, Loader2 } from "lucide-react"
import Link from "next/link"

export default function AIPersonalizedPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Generate or get user ID (in a real app, this would come from authentication)
    const storedUserId = localStorage.getItem("newsmania-user-id")
    if (storedUserId) {
      setUserId(storedUserId)
    } else {
      const newUserId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem("newsmania-user-id", newUserId)
      setUserId(newUserId)
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <NewsHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-xl">Initializing AI personalization...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        <NewsHeader />
        <main className="container mx-auto px-4 py-8">
          <Alert className="mb-6 bg-red-900/20 border-red-600">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              Unable to initialize personalization. Please refresh the page.
            </AlertDescription>
          </Alert>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <NewsHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full">
                <Brain className="h-12 w-12 text-white" />
              </div>
              <Sparkles className="h-8 w-8 text-yellow-400 animate-pulse" />
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              For You
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience news like never before with AI that adapts to your reading habits and interests
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-300">
                  <Brain className="h-5 w-5" />
                  Smart Learning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Our AI learns from your reading patterns, time spent, and interactions to understand your preferences
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-300">
                  <TrendingUp className="h-5 w-5" />
                  Real-time Adaptation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Recommendations improve with every article you read, ensuring fresh and relevant content
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-300">
                  <Zap className="h-5 w-5" />
                  Personalized Headlines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Headlines are enhanced with AI to match your interests while maintaining journalistic integrity
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Getting Started */}
          <Card className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-full">
                    <User className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Getting Started</h3>
                    <p className="text-gray-400">
                      Your AI profile: <code className="text-purple-400">{userId}</code>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard">
                      View Analytics
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Personalized Feed */}
        <MLPersonalizedFeed userId={userId} />
      </main>
    </div>
  )
}

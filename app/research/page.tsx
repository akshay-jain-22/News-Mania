"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Lightbulb, BarChart3, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="bg-[#121212] border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold">NewsMania</span>
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/" className="hover:text-primary transition-colors">
                Latest
              </Link>
              <Link href="/personalized" className="hover:text-primary transition-colors">
                Personalized
              </Link>
              <Link href="/topics" className="hover:text-primary transition-colors">
                Topics
              </Link>
              <Link href="/research" className="text-primary font-medium">
                Research
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">How Our AI Works</h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl">
            Transparency in AI-powered news curation. Learn about the algorithms and formulas that power NewsMania's
            personalized recommendations and credibility analysis.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="recommendations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-[#1a1a1a] border-gray-800">
            <TabsTrigger value="recommendations" className="data-[state=active]:bg-primary">
              <BarChart3 className="h-4 w-4 mr-2" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="credibility" className="data-[state=active]:bg-primary">
              <Zap className="h-4 w-4 mr-2" />
              Credibility
            </TabsTrigger>
            <TabsTrigger value="methodology" className="data-[state=active]:bg-primary">
              <Lightbulb className="h-4 w-4 mr-2" />
              Methodology
            </TabsTrigger>
          </TabsList>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Hybrid Recommendation Engine
                </CardTitle>
                <CardDescription>
                  Our recommendation system combines three complementary approaches for optimal personalization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Main Formula */}
                <div className="bg-[#0a0a0a] p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold mb-4">Final Recommendation Score</h3>
                  <div className="bg-gray-900 p-4 rounded font-mono text-sm mb-4 overflow-x-auto">
                    <p className="text-primary">FinalScore = (Collab × 0.4) + (Content × 0.4) + (Demo × 0.2)</p>
                  </div>
                  <p className="text-gray-400 text-sm">
                    The final score combines three weighted components: collaborative filtering (40%), content-based
                    filtering (40%), and demographic factors (20%).
                  </p>
                </div>

                {/* Collaborative Filtering */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600">Collaborative Filtering (40%)</Badge>
                  </div>
                  <p className="text-gray-400">
                    Analyzes article popularity, credibility scores, and source reputation to identify high-quality
                    content that resonates with users.
                  </p>
                  <div className="bg-gray-900 p-4 rounded font-mono text-sm">
                    <p className="text-gray-300">
                      CollabScore = (CredibilityScore × 0.6 + MajorSourceBonus × 0.4) × 0.8 + 0.2
                    </p>
                  </div>
                </div>

                {/* Content-Based Filtering */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">Content-Based Filtering (40%)</Badge>
                  </div>
                  <p className="text-gray-400">
                    Matches article categories and keywords with your reading history and preferences to find relevant
                    content.
                  </p>
                  <div className="bg-gray-900 p-4 rounded font-mono text-sm">
                    <p className="text-gray-300">ContentScore = (CategoryPreference × 0.7) + (KeywordMatches × 0.3)</p>
                  </div>
                </div>

                {/* Demographic Factors */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-600">Demographic Factors (20%)</Badge>
                  </div>
                  <p className="text-gray-400">
                    Considers your category preferences and reading patterns to personalize recommendations based on
                    your interests.
                  </p>
                  <div className="bg-gray-900 p-4 rounded font-mono text-sm">
                    <p className="text-gray-300">DemoScore = NormalizedCategoryPreference</p>
                  </div>
                </div>

                {/* Time Decay */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-600">Time Decay Factor</Badge>
                  </div>
                  <p className="text-gray-400">
                    Newer articles receive higher scores, but older articles still have value. This ensures fresh news
                    while maintaining quality.
                  </p>
                  <div className="bg-gray-900 p-4 rounded font-mono text-sm">
                    <p className="text-gray-300">timeDecay = e^(−λ·Δt) where λ = 0.05</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Δt = hours since publication, λ = decay factor (0.05 means 5% decay per hour)
                  </p>
                </div>

                {/* Diversity Penalty */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-600">Diversity Penalty</Badge>
                  </div>
                  <p className="text-gray-400">
                    Reduces scores for articles similar to recently read ones, ensuring variety in your feed.
                  </p>
                  <div className="bg-gray-900 p-4 rounded font-mono text-sm">
                    <p className="text-gray-300">AdjustedScore = Original × (1 − Penalty)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credibility Tab */}
          <TabsContent value="credibility" className="space-y-6">
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Credibility Analysis System
                </CardTitle>
                <CardDescription>How we evaluate the trustworthiness and accuracy of news articles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Credibility Score */}
                <div className="bg-[#0a0a0a] p-6 rounded-lg border border-gray-800">
                  <h3 className="text-lg font-semibold mb-4">Credibility Score Calculation</h3>
                  <div className="bg-gray-900 p-4 rounded font-mono text-sm mb-4 overflow-x-auto">
                    <p className="text-primary">Confidence = (Quality + TimeSpan + Consistency) / 3</p>
                  </div>
                  <p className="text-gray-400 text-sm">
                    The credibility score combines three factors: content quality, publication timespan, and consistency
                    across sources.
                  </p>
                </div>

                {/* Quality Factor */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600">Quality Factor</Badge>
                  </div>
                  <p className="text-gray-400">
                    Evaluates the depth, accuracy, and sourcing of the article. Articles with citations and expert
                    quotes score higher.
                  </p>
                </div>

                {/* TimeSpan Factor */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">TimeSpan Factor</Badge>
                  </div>
                  <p className="text-gray-400">
                    Considers how long the story has been developing. Breaking news gets lower initial scores until
                    verified.
                  </p>
                </div>

                {/* Consistency Factor */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-600">Consistency Factor</Badge>
                  </div>
                  <p className="text-gray-400">
                    Checks if the article's claims align with reporting from other reputable sources.
                  </p>
                </div>

                {/* Credibility Levels */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Credibility Levels</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-900/20 border border-green-700 p-4 rounded">
                      <div className="font-semibold text-green-400 mb-2">High (70-100%)</div>
                      <p className="text-sm text-gray-400">Well-sourced, verified facts from reputable outlets</p>
                    </div>
                    <div className="bg-yellow-900/20 border border-yellow-700 p-4 rounded">
                      <div className="font-semibold text-yellow-400 mb-2">Medium (40-69%)</div>
                      <p className="text-sm text-gray-400">Some verification, mixed sources, or developing stories</p>
                    </div>
                    <div className="bg-red-900/20 border border-red-700 p-4 rounded">
                      <div className="font-semibold text-red-400 mb-2">Low (0-39%)</div>
                      <p className="text-sm text-gray-400">
                        Unverified claims, questionable sources, or misinformation
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Methodology Tab */}
          <TabsContent value="methodology" className="space-y-6">
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Our Methodology
                </CardTitle>
                <CardDescription>The principles and techniques behind NewsMania's AI systems</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Embeddings */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">Semantic Understanding with Embeddings</h4>
                  <p className="text-gray-400">
                    We use advanced embedding models to understand the semantic meaning of articles and user
                    preferences. This allows us to find relevant content even when keywords don't match exactly.
                  </p>
                  <div className="bg-gray-900 p-4 rounded font-mono text-sm">
                    <p className="text-gray-300">Similarity = CosineSimilarity(UserEmbedding, ArticleEmbedding)</p>
                  </div>
                </div>

                {/* Collaborative Filtering */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">Collaborative Filtering</h4>
                  <p className="text-gray-400">
                    We analyze patterns across all users to identify articles that similar users have found valuable.
                  </p>
                  <div className="bg-gray-900 p-4 rounded font-mono text-sm">
                    <p className="text-gray-300">UserSim(u1,u2) = Σi(ru1,i·ru2,i) / (√Σi ru1,i² · √Σi ru2,i²)</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Calculates user similarity using cosine similarity of rating vectors
                  </p>
                </div>

                {/* Content-Based Filtering */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">Content-Based Filtering</h4>
                  <p className="text-gray-400">
                    We analyze article features and match them with your reading history to find similar content you'll
                    enjoy.
                  </p>
                  <div className="bg-gray-900 p-4 rounded font-mono text-sm">
                    <p className="text-gray-300">Prediction(u,i) = Σv(UserSim(u,v)×rv,i) / Σv |UserSim(u,v)|</p>
                  </div>
                  <p className="text-xs text-gray-500">Predicts user ratings based on similar users' ratings</p>
                </div>

                {/* TF-IDF */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">TF-IDF for Keyword Analysis</h4>
                  <p className="text-gray-400">
                    We use Term Frequency-Inverse Document Frequency to identify important keywords in articles.
                  </p>
                  <div className="bg-gray-900 p-4 rounded font-mono text-sm space-y-2">
                    <p className="text-gray-300">TF(t,d) = f(t,d)/Σw f(w,d)</p>
                    <p className="text-gray-300">IDF(t,D) = log(|D| / |D_t|)</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    TF = term frequency in document, IDF = inverse document frequency across corpus
                  </p>
                </div>

                {/* Freshness Boost */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">Freshness Boost Algorithm</h4>
                  <p className="text-gray-400">
                    Recent articles get a boost to ensure you see the latest news while maintaining quality standards.
                  </p>
                  <div className="bg-gray-900 p-4 rounded font-mono text-sm">
                    <p className="text-gray-300">FreshBoost = max(0, (24 − hOld)/24) × Factor</p>
                  </div>
                  <p className="text-xs text-gray-500">hOld = hours since publication, Factor = boost multiplier</p>
                </div>

                {/* Privacy */}
                <div className="bg-blue-900/20 border border-blue-700 p-6 rounded-lg">
                  <h4 className="font-semibold text-blue-400 mb-2">Privacy First</h4>
                  <p className="text-gray-400 text-sm">
                    All personalization happens locally on your device or in secure, encrypted servers. We never sell
                    your data or share it with third parties. Your reading history is yours alone.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer CTA */}
        <div className="mt-12 bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Experience Personalized News?</h3>
          <p className="text-gray-400 mb-6">
            Start using NewsMania's AI-powered recommendations to discover news tailored to your interests.
          </p>
          <Button size="lg" asChild>
            <Link href="/personalized">Get Personalized News</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}

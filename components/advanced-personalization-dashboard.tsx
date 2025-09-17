"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import {
  Brain,
  TrendingUp,
  Clock,
  Target,
  Users,
  Activity,
  Zap,
  Eye,
  ThumbsUp,
  Share2,
  BookOpen,
  BarChart3,
  Settings,
} from "lucide-react"

interface UserInsights {
  profile_strength: number
  top_categories: Array<{ category: string; score: number }>
  reading_patterns: {
    peak_hours: number[]
    preferred_length: string
    engagement_level: string
  }
  recommendations_performance: {
    click_through_rate: number
    average_read_time: number
    categories_explored: number
  }
  behavioral_trends: {
    consistency_score: number
    diversity_score: number
    recent_changes: string[]
  }
}

interface RecommendationMetadata {
  pipeline_used: "cold_start" | "behavioral" | "hybrid"
  confidence: number
  processing_time: number
  user_segment?: string
  explanation: string
}

export function AdvancedPersonalizationDashboard({ userId }: { userId: string }) {
  const [insights, setInsights] = useState<UserInsights | null>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [metadata, setMetadata] = useState<RecommendationMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadUserData()
  }, [userId])

  const loadUserData = async () => {
    try {
      setLoading(true)

      // Load user insights
      const insightsResponse = await fetch(`/api/user-insights?userId=${userId}`)
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json()
        setInsights(insightsData.insights)
      }

      // Load recommendations
      const recsResponse = await fetch(`/api/recommendations?userId=${userId}&limit=10`)
      if (recsResponse.ok) {
        const recsData = await recsResponse.json()
        setRecommendations(recsData.recommendations)
        setMetadata(recsData.metadata)
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const trackInteraction = async (articleId: string, action: string) => {
    try {
      await fetch("/api/track-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          article_id: articleId,
          action,
          device_type: "desktop",
          source: "dashboard",
        }),
      })

      // Reload data to show updated insights
      setTimeout(loadUserData, 1000)
    } catch (error) {
      console.error("Error tracking interaction:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading personalization insights...</p>
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600">No insights available. Start reading articles to build your profile!</p>
      </div>
    )
  }

  const categoryColors = {
    politics: "#ef4444",
    business: "#10b981",
    technology: "#3b82f6",
    entertainment: "#f59e0b",
    sports: "#8b5cf6",
    health: "#06b6d4",
    science: "#84cc16",
    environment: "#f97316",
  }

  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour}:00`,
    activity: insights.reading_patterns.peak_hours.includes(hour) ? 100 : Math.random() * 50,
  }))

  const categoryData = insights.top_categories.map((cat) => ({
    name: cat.category,
    value: Math.round(cat.score * 100),
    color: categoryColors[cat.category as keyof typeof categoryColors] || "#6b7280",
  }))

  const radarData = [
    { subject: "Profile Strength", A: insights.profile_strength * 100, fullMark: 100 },
    { subject: "Consistency", A: insights.behavioral_trends.consistency_score * 100, fullMark: 100 },
    { subject: "Diversity", A: insights.behavioral_trends.diversity_score * 100, fullMark: 100 },
    {
      subject: "Engagement",
      A:
        insights.reading_patterns.engagement_level === "high"
          ? 100
          : insights.reading_patterns.engagement_level === "medium"
            ? 60
            : 30,
      fullMark: 100,
    },
    { subject: "CTR", A: insights.recommendations_performance.click_through_rate * 100, fullMark: 100 },
    { subject: "Exploration", A: (insights.recommendations_performance.categories_explored / 8) * 100, fullMark: 100 },
  ]

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personalization Dashboard</h1>
          <p className="text-gray-600 mt-1">AI-powered news recommendations tailored for you</p>
        </div>
        <div className="flex items-center gap-4">
          {metadata && (
            <Badge variant="outline" className="px-3 py-1">
              <Brain className="h-4 w-4 mr-1" />
              {metadata.pipeline_used.replace("_", " ").toUpperCase()}
            </Badge>
          )}
          <Button onClick={loadUserData} variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profile Strength</p>
                <p className="text-2xl font-bold text-gray-900">{Math.round(insights.profile_strength * 100)}%</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <Progress value={insights.profile_strength * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Click-Through Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(insights.recommendations_performance.click_through_rate * 100)}%
                </p>
              </div>
              <Eye className="h-8 w-8 text-green-500" />
            </div>
            <Progress value={insights.recommendations_performance.click_through_rate * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Read Time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(insights.recommendations_performance.average_read_time / 60)}m
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories Explored</p>
                <p className="text-2xl font-bold text-gray-900">
                  {insights.recommendations_performance.categories_explored}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Profile Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Score" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Category Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Changes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Behavioral Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {insights.behavioral_trends.recent_changes.map((change, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{change}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Category Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.top_categories.map((category, index) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">{category.category}</span>
                        <span className="text-sm text-gray-600">{Math.round(category.score * 100)}%</span>
                      </div>
                      <Progress value={category.score * 100} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reading Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Reading Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Preferred Length</span>
                  <Badge variant="secondary">{insights.reading_patterns.preferred_length}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Engagement Level</span>
                  <Badge
                    variant={
                      insights.reading_patterns.engagement_level === "high"
                        ? "default"
                        : insights.reading_patterns.engagement_level === "medium"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {insights.reading_patterns.engagement_level}
                  </Badge>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Peak Reading Hours</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {insights.reading_patterns.peak_hours.map((hour) => (
                      <Badge key={hour} variant="outline">
                        {hour}:00
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          {/* Hourly Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Daily Reading Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="activity" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Behavioral Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Consistency Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {Math.round(insights.behavioral_trends.consistency_score * 100)}%
                  </div>
                  <Progress value={insights.behavioral_trends.consistency_score * 100} className="mb-2" />
                  <p className="text-sm text-gray-600">How regular your reading habits are</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Diversity Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {Math.round(insights.behavioral_trends.diversity_score * 100)}%
                  </div>
                  <Progress value={insights.behavioral_trends.diversity_score * 100} className="mb-2" />
                  <p className="text-sm text-gray-600">How varied your interests are</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {/* Recommendation Performance */}
          {metadata && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Recommendation Engine Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Pipeline Used</p>
                    <p className="text-lg font-semibold capitalize">{metadata.pipeline_used.replace("_", " ")}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Confidence</p>
                    <p className="text-lg font-semibold">{Math.round(metadata.confidence * 100)}%</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <p className="text-sm text-gray-600">Processing Time</p>
                    <p className="text-lg font-semibold">{metadata.processing_time}ms</p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-blue-800">{metadata.explanation}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Current Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.slice(0, 5).map((rec, index) => (
                  <div key={rec.article.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{rec.article.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{rec.article.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Badge variant="outline">{rec.article.category}</Badge>
                          <span>Score: {Math.round(rec.score * 100)}%</span>
                          <span>•</span>
                          <span>{rec.explanation}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" variant="outline" onClick={() => trackInteraction(rec.article.id, "click")}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => trackInteraction(rec.article.id, "like")}>
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => trackInteraction(rec.article.id, "share")}>
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* AI Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI-Generated Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Reading Behavior Analysis</h4>
                <p className="text-sm text-blue-800">
                  Based on your reading patterns, you prefer {insights.reading_patterns.preferred_length} articles and
                  show {insights.reading_patterns.engagement_level} engagement levels. Your most active reading times
                  are around {insights.reading_patterns.peak_hours.join(", ")} hours.
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Recommendation Performance</h4>
                <p className="text-sm text-green-800">
                  Your click-through rate of {Math.round(insights.recommendations_performance.click_through_rate * 100)}
                  % is {insights.recommendations_performance.click_through_rate > 0.3 ? "above" : "below"} average.
                  You've explored {insights.recommendations_performance.categories_explored} different categories,
                  showing {insights.recommendations_performance.categories_explored > 5 ? "diverse" : "focused"}{" "}
                  interests.
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Profile Strength</h4>
                <p className="text-sm text-purple-800">
                  Your profile strength of {Math.round(insights.profile_strength * 100)}% indicates
                  {insights.profile_strength > 0.7
                    ? "excellent"
                    : insights.profile_strength > 0.4
                      ? "good"
                      : "developing"}
                  personalization accuracy.{" "}
                  {insights.profile_strength < 0.5
                    ? "Continue reading to improve recommendations!"
                    : "Great job building a strong preference profile!"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Improvement Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Improvement Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.profile_strength < 0.5 && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded">
                    <BookOpen className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Read More Articles</p>
                      <p className="text-xs text-yellow-800">
                        Reading more articles will help us better understand your preferences
                      </p>
                    </div>
                  </div>
                )}

                {insights.behavioral_trends.diversity_score < 0.3 && (
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded">
                    <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Explore New Categories</p>
                      <p className="text-xs text-blue-800">
                        Try reading articles from different categories to discover new interests
                      </p>
                    </div>
                  </div>
                )}

                {insights.recommendations_performance.click_through_rate < 0.2 && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded">
                    <Activity className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Engage More</p>
                      <p className="text-xs text-green-800">
                        Like, share, or save articles you enjoy to improve recommendations
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

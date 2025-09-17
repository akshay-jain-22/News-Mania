"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  BarChart,
  Bar,
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
  Target,
  Zap,
  Eye,
  Share2,
  Bookmark,
  MousePointer,
  SkipForward,
  RefreshCw,
  Download,
} from "lucide-react"

interface UserAnalytics {
  totalInteractions: number
  avgDailyInteractions: number
  topCategories: Array<{ category: string; count: number }>
  readingPatterns: Array<{ hour: number; count: number }>
  engagementTrend: Array<{ date: string; score: number }>
}

interface RecommendationInsights {
  pipeline: string
  confidence: number
  reasoning: string[]
  abTestVariant?: string
  performanceMetrics: {
    clickThroughRate: number
    engagementRate: number
    diversityScore: number
  }
}

export default function AdvancedPersonalizationDashboard() {
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
  const [insights, setInsights] = useState<RecommendationInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load user analytics
      const analyticsResponse = await fetch("/api/user-insights")
      const analyticsData = await analyticsResponse.json()
      setAnalytics(analyticsData)

      // Load recommendation insights
      const insightsResponse = await fetch("/api/recommendation-insights")
      const insightsData = await insightsResponse.json()
      setInsights(insightsData)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const refreshAnalytics = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const exportData = async () => {
    try {
      const response = await fetch("/api/export-user-data")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "user-analytics.csv"
      a.click()
    } catch (error) {
      console.error("Error exporting data:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Personalization Dashboard</h1>
          <p className="text-gray-600">Advanced AI-powered news recommendation analytics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshAnalytics} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Interactions</p>
                <p className="text-2xl font-bold">{analytics?.totalInteractions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Daily Average</p>
                <p className="text-2xl font-bold">{analytics?.avgDailyInteractions.toFixed(1) || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">AI Confidence</p>
                <p className="text-2xl font-bold">{((insights?.confidence || 0) * 100).toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                <p className="text-2xl font-bold">
                  {((insights?.performanceMetrics?.engagementRate || 0) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="behavior">Behavior</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="testing">A/B Testing</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Category Preferences</CardTitle>
                <CardDescription>Your reading interests distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics?.topCategories || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics?.topCategories?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Reading Patterns */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Reading Patterns</CardTitle>
                <CardDescription>When you're most active</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics?.readingPatterns || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Trend</CardTitle>
              <CardDescription>Your engagement over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.engagementTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Behavioral Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Behavioral Analysis</CardTitle>
                <CardDescription>AI-detected patterns in your reading behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Morning Reader</span>
                  <Progress value={75} className="w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Deep Engagement</span>
                  <Progress value={60} className="w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Category Explorer</span>
                  <Progress value={85} className="w-24" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Social Sharer</span>
                  <Progress value={40} className="w-24" />
                </div>
              </CardContent>
            </Card>

            {/* Interaction Types */}
            <Card>
              <CardHeader>
                <CardTitle>Interaction Distribution</CardTitle>
                <CardDescription>How you engage with content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-sm">Views</span>
                    </div>
                    <Badge variant="secondary">65%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <MousePointer className="h-4 w-4 mr-2 text-green-600" />
                      <span className="text-sm">Clicks</span>
                    </div>
                    <Badge variant="secondary">20%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Share2 className="h-4 w-4 mr-2 text-purple-600" />
                      <span className="text-sm">Shares</span>
                    </div>
                    <Badge variant="secondary">8%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Bookmark className="h-4 w-4 mr-2 text-orange-600" />
                      <span className="text-sm">Saves</span>
                    </div>
                    <Badge variant="secondary">5%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <SkipForward className="h-4 w-4 mr-2 text-red-600" />
                      <span className="text-sm">Skips</span>
                    </div>
                    <Badge variant="secondary">2%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle>Active Pipeline</CardTitle>
                <CardDescription>Current recommendation strategy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <Badge variant="default" className="text-lg px-4 py-2">
                    {insights?.pipeline || "Hybrid"}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-2">
                    Confidence: {((insights?.confidence || 0) * 100).toFixed(0)}%
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
                <CardDescription>Recommendation effectiveness</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Click-through Rate</span>
                    <span>{((insights?.performanceMetrics?.clickThroughRate || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(insights?.performanceMetrics?.clickThroughRate || 0) * 100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Engagement Rate</span>
                    <span>{((insights?.performanceMetrics?.engagementRate || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(insights?.performanceMetrics?.engagementRate || 0) * 100} />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Diversity Score</span>
                    <span>{((insights?.performanceMetrics?.diversityScore || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(insights?.performanceMetrics?.diversityScore || 0) * 100} />
                </div>
              </CardContent>
            </Card>

            {/* AI Reasoning */}
            <Card>
              <CardHeader>
                <CardTitle>AI Reasoning</CardTitle>
                <CardDescription>Why these recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insights?.reasoning?.map((reason, index) => (
                    <div key={index} className="flex items-start">
                      <Zap className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{reason}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              A/B testing helps optimize your personalized experience. Current variant:{" "}
              {insights?.abTestVariant || "Control"}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Performance</CardTitle>
                <CardDescription>Comparing recommendation strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      { variant: "Control", ctr: 0.12, engagement: 0.08 },
                      { variant: "Collaborative", ctr: 0.15, engagement: 0.11 },
                      { variant: "Content-Based", ctr: 0.13, engagement: 0.09 },
                      { variant: "Behavioral", ctr: 0.16, engagement: 0.12 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="variant" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="ctr" fill="#8884d8" name="Click-through Rate" />
                    <Bar dataKey="engagement" fill="#82ca9d" name="Engagement Rate" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Status</CardTitle>
                <CardDescription>Continuous learning progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Model Training</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Data Collection</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Pattern Recognition</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Personalization Accuracy</span>
                    <span>88%</span>
                  </div>
                  <Progress value={88} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Predictive Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Predictive Insights</CardTitle>
                <CardDescription>AI predictions for your reading preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">Next Hour Prediction</h4>
                  <p className="text-sm text-blue-700">
                    You're likely to read <strong>Technology</strong> and <strong>Business</strong> articles
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900">Today's Recommendations</h4>
                  <p className="text-sm text-green-700">
                    Focus on <strong>Politics</strong>, <strong>Science</strong>, and <strong>Health</strong>
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900">Weekly Trend</h4>
                  <p className="text-sm text-purple-700">
                    Increasing interest in <strong>Climate</strong> and <strong>AI</strong> topics
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Learning Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
                <CardDescription>How well the AI understands your preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart
                    data={[
                      { subject: "Category Preferences", A: 85, fullMark: 100 },
                      { subject: "Time Patterns", A: 70, fullMark: 100 },
                      { subject: "Content Depth", A: 90, fullMark: 100 },
                      { subject: "Source Preferences", A: 75, fullMark: 100 },
                      { subject: "Engagement Style", A: 80, fullMark: 100 },
                      { subject: "Topic Trends", A: 65, fullMark: 100 },
                    ]}
                  >
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Understanding" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* AI Recommendations for Improvement */}
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations for Better Personalization</CardTitle>
              <CardDescription>Suggestions to improve your news experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Diversify Reading Times</h4>
                  <p className="text-sm text-gray-600">
                    Try reading during different hours to help us understand your full daily pattern.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Explore New Categories</h4>
                  <p className="text-sm text-gray-600">
                    Consider reading Science or Health articles to broaden your interest profile.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Provide More Feedback</h4>
                  <p className="text-sm text-gray-600">
                    Use like/dislike buttons more often to help us learn your preferences faster.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Engage with Content</h4>
                  <p className="text-sm text-gray-600">
                    Share and save articles you find interesting to improve recommendation accuracy.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

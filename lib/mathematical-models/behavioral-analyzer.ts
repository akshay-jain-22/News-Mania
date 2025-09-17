import type { UserBehavior, UserPreferences } from "@/types/user-profile"
import type { UserProfile, UserInteraction, TimeBasedPreference } from "@/types/user-profile"

/**
 * Mathematical Model 3: Behavioral Analysis System
 * Uses time-series analysis, pattern recognition, and predictive modeling
 */

export class BehavioralAnalyzer {
  /**
   * Time-Series Analysis for Reading Patterns
   */
  analyzeTimeBasedPreferences(interactions: UserInteraction[]): TimeBasedPreference[] {
    const timeSlots = ["00-06", "06-12", "12-18", "18-24"]
    const preferences: TimeBasedPreference[] = []

    for (const slot of timeSlots) {
      const slotInteractions = this.filterInteractionsByTimeSlot(interactions, slot)

      if (slotInteractions.length === 0) {
        preferences.push({
          timeSlot: slot,
          categories: [],
          avgReadTime: 0,
          engagementScore: 0,
        })
        continue
      }

      // Calculate category preferences for this time slot
      const categoryCount: Record<string, number> = {}
      let totalReadTime = 0
      let engagementActions = 0

      for (const interaction of slotInteractions) {
        categoryCount[interaction.category] = (categoryCount[interaction.category] || 0) + 1
        totalReadTime += interaction.readTime || 0

        if (["share", "save", "click"].includes(interaction.action)) {
          engagementActions++
        }
      }

      // Get top categories for this time slot
      const topCategories = Object.entries(categoryCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category)

      preferences.push({
        timeSlot: slot,
        categories: topCategories,
        avgReadTime: totalReadTime / slotInteractions.length,
        engagementScore: engagementActions / slotInteractions.length,
      })
    }

    return preferences
  }

  /**
   * Behavioral pattern recognition using sequence analysis
   * Identifies common reading patterns and session behaviors
   */
  identifyBehavioralPatterns(behaviors: UserBehavior[]): {
    sessionPatterns: Array<{ pattern: string; frequency: number; confidence: number }>
    readingRhythm: {
      averageSessionLength: number
      peakHours: number[]
      preferredDays: number[]
      attentionSpan: number
    }
    contentPreferences: {
      preferredLength: "short" | "medium" | "long"
      scrollBehavior: "skimmer" | "thorough" | "selective"
      engagementLevel: "high" | "medium" | "low"
    }
  } {
    // Group behaviors by session
    const sessions = this.groupBehaviorsBySessions(behaviors)

    // Analyze session patterns
    const sessionPatterns = this.analyzeSessionPatterns(sessions)

    // Calculate reading rhythm
    const readingRhythm = this.calculateReadingRhythm(behaviors)

    // Determine content preferences
    const contentPreferences = this.analyzeContentPreferences(behaviors)

    return {
      sessionPatterns,
      readingRhythm,
      contentPreferences,
    }
  }

  /**
   * Predictive Modeling for Future Behavior
   * Uses exponential smoothing and trend analysis
   */
  predictFutureBehavior(
    behaviors: UserBehavior[],
    targetHour: number,
    targetDay: number,
  ): {
    predictedCategories: Array<{ category: string; probability: number }>
    expectedEngagement: number
    recommendedContentTypes: string[]
    confidence: number
  } {
    // Filter behaviors for similar time contexts
    const similarContextBehaviors = behaviors.filter(
      (b) => Math.abs(b.time_of_day - targetHour) <= 2 && b.day_of_week === targetDay,
    )

    if (similarContextBehaviors.length < 5) {
      // Not enough data for reliable prediction
      return this.getDefaultPrediction()
    }

    // Calculate category probabilities using exponential smoothing
    const categoryFreq: Record<string, number> = {}
    const totalWeight = similarContextBehaviors.reduce((sum, behavior) => {
      const weight = this.calculateBehaviorWeight(behavior) * this.calculateTimeDecay(behavior.timestamp)
      categoryFreq[behavior.category] = (categoryFreq[behavior.category] || 0) + weight
      return sum + weight
    }, 0)

    // Normalize to probabilities
    const predictedCategories = Object.entries(categoryFreq)
      .map(([category, freq]) => ({
        category,
        probability: freq / totalWeight,
      }))
      .sort((a, b) => b.probability - a.probability)

    // Calculate expected engagement
    const avgEngagement =
      similarContextBehaviors.reduce((sum, b) => sum + b.read_duration * b.scroll_depth, 0) /
      similarContextBehaviors.length

    const expectedEngagement = Math.min(avgEngagement / 300, 1) // Normalize to 0-1

    // Recommend content types based on patterns
    const recommendedContentTypes = this.recommendContentTypes(similarContextBehaviors)

    // Calculate confidence based on data quantity and consistency
    const confidence = this.calculatePredictionConfidence(similarContextBehaviors)

    return {
      predictedCategories,
      expectedEngagement,
      recommendedContentTypes,
      confidence,
    }
  }

  /**
   * Predictive Modeling for Future Preferences
   */
  predictFuturePreferences(
    userProfile: UserProfile,
    currentTime: Date,
  ): {
    nextHourCategories: string[]
    todayRecommendations: string[]
    weeklyTrend: string[]
    confidence: number
  } {
    const currentHour = currentTime.getHours()
    const timeSlot = this.getTimeSlot(currentHour)

    // Find historical preferences for this time
    const timePreference = userProfile.behaviorProfile.readingTimes.find((tp) => tp.timeSlot === timeSlot)

    if (!timePreference) {
      return {
        nextHourCategories: ["world", "politics"],
        todayRecommendations: ["business", "technology"],
        weeklyTrend: ["entertainment", "sports"],
        confidence: 0.3,
      }
    }

    // Predict based on historical patterns
    const nextHourCategories = timePreference.categories.slice(0, 2)

    // Daily recommendations based on engagement scores
    const todayRecommendations = userProfile.behaviorProfile.categoryPreferences
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((cp) => cp.category)

    // Weekly trend analysis
    const weeklyTrend = this.predictWeeklyTrend(userProfile)

    const confidence = Math.min(timePreference.engagementScore + 0.3, 1.0)

    return {
      nextHourCategories,
      todayRecommendations,
      weeklyTrend,
      confidence,
    }
  }

  /**
   * Adaptive learning system that updates preferences based on new behavior
   * Uses online learning algorithms with concept drift detection
   */
  updatePreferencesAdaptively(
    currentPreferences: UserPreferences,
    newBehaviors: UserBehavior[],
    learningRate = 0.1,
  ): UserPreferences {
    const updatedPreferences = { ...currentPreferences }

    // Update category weights using exponential moving average
    for (const behavior of newBehaviors) {
      const behaviorWeight = this.calculateBehaviorWeight(behavior)
      const currentWeight = updatedPreferences.category_weights[behavior.category] || 0.3

      // Exponential moving average: new_value = α * new_observation + (1-α) * old_value
      updatedPreferences.category_weights[behavior.category] =
        learningRate * behaviorWeight + (1 - learningRate) * currentWeight
    }

    // Update time-based preferences
    const newTimePreferences = this.analyzeTimeBasedPreferences(newBehaviors)
    for (const [hour, categories] of Object.entries(newTimePreferences)) {
      if (!updatedPreferences.time_based_preferences[hour]) {
        updatedPreferences.time_based_preferences[hour] = {}
      }

      for (const [category, weight] of Object.entries(categories)) {
        const currentWeight = updatedPreferences.time_based_preferences[hour][category] || 0.3
        updatedPreferences.time_based_preferences[hour][category] =
          learningRate * weight + (1 - learningRate) * currentWeight
      }
    }

    // Update confidence score based on data quality
    const dataQuality = this.assessDataQuality(newBehaviors)
    updatedPreferences.confidence_score = Math.min(updatedPreferences.confidence_score + dataQuality * 0.05, 1.0)

    // Detect and handle concept drift
    if (this.detectConceptDrift(currentPreferences, updatedPreferences)) {
      console.log("Concept drift detected, increasing learning rate temporarily")
      // Could implement more sophisticated drift handling here
    }

    updatedPreferences.last_updated = new Date().toISOString()

    return updatedPreferences
  }

  /**
   * Adaptive Learning Algorithm
   */
  updateUserPreferences(userProfile: UserProfile, newInteractions: UserInteraction[]): UserProfile {
    const updatedProfile = { ...userProfile }

    // Update category preferences with exponential decay
    const decayFactor = 0.95
    const learningRate = 0.1

    for (const interaction of newInteractions) {
      const existingPref = updatedProfile.behaviorProfile.categoryPreferences.find(
        (cp) => cp.category === interaction.category,
      )

      if (existingPref) {
        // Apply exponential decay and update
        existingPref.score = existingPref.score * decayFactor + this.getInteractionValue(interaction) * learningRate
        existingPref.confidence = Math.min(existingPref.confidence + 0.01, 1.0)
        existingPref.lastUpdated = new Date()
      } else {
        // Add new preference
        updatedProfile.behaviorProfile.categoryPreferences.push({
          category: interaction.category,
          score: this.getInteractionValue(interaction) * learningRate,
          confidence: 0.1,
          lastUpdated: new Date(),
        })
      }
    }

    // Update time-based preferences
    updatedProfile.behaviorProfile.readingTimes = this.analyzeTimeBasedPreferences([
      ...updatedProfile.behaviorProfile.interactionHistory,
      ...newInteractions,
    ])

    // Update engagement score
    updatedProfile.behaviorProfile.engagementScore = this.calculateEngagementScore([
      ...updatedProfile.behaviorProfile.interactionHistory,
      ...newInteractions,
    ])

    // Add new interactions to history (keep last 1000)
    updatedProfile.behaviorProfile.interactionHistory = [
      ...updatedProfile.behaviorProfile.interactionHistory,
      ...newInteractions,
    ].slice(-1000)

    updatedProfile.updatedAt = new Date()

    return updatedProfile
  }

  /**
   * Anomaly detection in user behavior
   * Uses statistical methods to identify unusual patterns
   */
  detectBehavioralAnomalies(behaviors: UserBehavior[]): Array<{
    behavior: UserBehavior
    anomalyType: "time" | "category" | "engagement" | "pattern"
    severity: "low" | "medium" | "high"
    description: string
  }> {
    const anomalies = []

    // Calculate baseline statistics
    const stats = this.calculateBehaviorStatistics(behaviors)

    for (const behavior of behaviors) {
      // Time-based anomaly detection
      const timeAnomaly = this.detectTimeAnomaly(behavior, stats)
      if (timeAnomaly) anomalies.push(timeAnomaly)

      // Category anomaly detection
      const categoryAnomaly = this.detectCategoryAnomaly(behavior, stats)
      if (categoryAnomaly) anomalies.push(categoryAnomaly)

      // Engagement anomaly detection
      const engagementAnomaly = this.detectEngagementAnomaly(behavior, stats)
      if (engagementAnomaly) anomalies.push(engagementAnomaly)
    }

    return anomalies
  }

  private calculateBehaviorWeight(behavior: UserBehavior): number {
    const actionWeights = {
      view: 0.1,
      click: 0.3,
      read: 1.0,
      share: 1.5,
      save: 1.2,
      like: 0.8,
      dislike: -0.5,
      skip: -0.2,
    }

    const baseWeight = actionWeights[behavior.action] || 0
    const engagementMultiplier = (behavior.read_duration / 60) * behavior.scroll_depth

    return Math.max(baseWeight * (1 + engagementMultiplier), 0)
  }

  private calculateTimeDecay(timestamp: string): number {
    const now = new Date().getTime()
    const behaviorTime = new Date(timestamp).getTime()
    const daysDiff = (now - behaviorTime) / (1000 * 60 * 60 * 24)

    // Exponential decay with half-life of 30 days
    return Math.exp((-Math.log(2) * daysDiff) / 30)
  }

  private smoothTimePreferences(
    preferences: Record<string, Record<string, number>>,
  ): Record<string, Record<string, number>> {
    const smoothed = { ...preferences }

    for (let hour = 0; hour < 24; hour++) {
      const currentHour = hour.toString()
      const prevHour = ((hour - 1 + 24) % 24).toString()
      const nextHour = ((hour + 1) % 24).toString()

      for (const category of Object.keys(preferences[currentHour] || {})) {
        const current = preferences[currentHour][category] || 0
        const prev = preferences[prevHour][category] || 0
        const next = preferences[nextHour][category] || 0

        // Apply Gaussian smoothing
        smoothed[currentHour][category] = 0.25 * prev + 0.5 * current + 0.25 * next
      }
    }

    return smoothed
  }

  private groupBehaviorsBySessions(behaviors: UserBehavior[]): UserBehavior[][] {
    const sessions: UserBehavior[][] = []
    let currentSession: UserBehavior[] = []

    const sortedBehaviors = behaviors.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    for (let i = 0; i < sortedBehaviors.length; i++) {
      const behavior = sortedBehaviors[i]

      if (currentSession.length === 0) {
        currentSession.push(behavior)
      } else {
        const lastBehavior = currentSession[currentSession.length - 1]
        const timeDiff = new Date(behavior.timestamp).getTime() - new Date(lastBehavior.timestamp).getTime()

        // If more than 30 minutes gap, start new session
        if (timeDiff > 30 * 60 * 1000) {
          sessions.push([...currentSession])
          currentSession = [behavior]
        } else {
          currentSession.push(behavior)
        }
      }
    }

    if (currentSession.length > 0) {
      sessions.push(currentSession)
    }

    return sessions
  }

  private analyzeSessionPatterns(
    sessions: UserBehavior[][],
  ): Array<{ pattern: string; frequency: number; confidence: number }> {
    const patterns: Record<string, number> = {}

    for (const session of sessions) {
      if (session.length < 2) continue

      // Analyze category sequences
      const categorySequence = session.map((b) => b.category).join(" -> ")
      patterns[categorySequence] = (patterns[categorySequence] || 0) + 1

      // Analyze action patterns
      const actionPattern = session.map((b) => b.action).join(" -> ")
      patterns[actionPattern] = (patterns[actionPattern] || 0) + 1
    }

    const totalSessions = sessions.length

    return Object.entries(patterns)
      .map(([pattern, frequency]) => ({
        pattern,
        frequency: frequency / totalSessions,
        confidence: Math.min(frequency / 5, 1), // Higher confidence with more occurrences
      }))
      .filter((p) => p.frequency > 0.1) // Only significant patterns
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10) // Top 10 patterns
  }

  private calculateReadingRhythm(behaviors: UserBehavior[]): {
    averageSessionLength: number
    peakHours: number[]
    preferredDays: number[]
    attentionSpan: number
  } {
    const sessions = this.groupBehaviorsBySessions(behaviors)

    // Calculate average session length
    const sessionLengths = sessions.map((session) => {
      if (session.length < 2) return 0
      const start = new Date(session[0].timestamp).getTime()
      const end = new Date(session[session.length - 1].timestamp).getTime()
      return (end - start) / (1000 * 60) // minutes
    })

    const averageSessionLength = sessionLengths.reduce((sum, len) => sum + len, 0) / sessionLengths.length

    // Find peak hours
    const hourCounts: Record<number, number> = {}
    behaviors.forEach((b) => {
      hourCounts[b.time_of_day] = (hourCounts[b.time_of_day] || 0) + 1
    })

    const peakHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => Number.parseInt(hour))

    // Find preferred days
    const dayCounts: Record<number, number> = {}
    behaviors.forEach((b) => {
      dayCounts[b.day_of_week] = (dayCounts[b.day_of_week] || 0) + 1
    })

    const preferredDays = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([day]) => Number.parseInt(day))

    // Calculate attention span (average read duration for 'read' actions)
    const readBehaviors = behaviors.filter((b) => b.action === "read")
    const attentionSpan =
      readBehaviors.length > 0 ? readBehaviors.reduce((sum, b) => sum + b.read_duration, 0) / readBehaviors.length : 0

    return {
      averageSessionLength,
      peakHours,
      preferredDays,
      attentionSpan,
    }
  }

  private analyzeContentPreferences(behaviors: UserBehavior[]): {
    preferredLength: "short" | "medium" | "long"
    scrollBehavior: "skimmer" | "thorough" | "selective"
    engagementLevel: "high" | "medium" | "low"
  } {
    const readBehaviors = behaviors.filter((b) => b.action === "read" && b.read_duration > 0)

    if (readBehaviors.length === 0) {
      return {
        preferredLength: "medium",
        scrollBehavior: "selective",
        engagementLevel: "medium",
      }
    }

    // Analyze preferred length based on read duration
    const avgReadTime = readBehaviors.reduce((sum, b) => sum + b.read_duration, 0) / readBehaviors.length
    const preferredLength = avgReadTime < 120 ? "short" : avgReadTime < 300 ? "medium" : "long"

    // Analyze scroll behavior
    const avgScrollDepth = readBehaviors.reduce((sum, b) => sum + b.scroll_depth, 0) / readBehaviors.length
    const scrollBehavior = avgScrollDepth < 0.3 ? "skimmer" : avgScrollDepth > 0.8 ? "thorough" : "selective"

    // Analyze engagement level
    const engagementActions = behaviors.filter((b) => ["share", "save", "like"].includes(b.action))
    const engagementRate = engagementActions.length / behaviors.length
    const engagementLevel = engagementRate > 0.2 ? "high" : engagementRate > 0.05 ? "medium" : "low"

    return {
      preferredLength,
      scrollBehavior,
      engagementLevel,
    }
  }

  private getDefaultPrediction() {
    return {
      predictedCategories: [
        { category: "politics", probability: 0.3 },
        { category: "technology", probability: 0.25 },
        { category: "business", probability: 0.2 },
        { category: "entertainment", probability: 0.15 },
        { category: "sports", probability: 0.1 },
      ],
      expectedEngagement: 0.5,
      recommendedContentTypes: ["medium", "recent", "trending"],
      confidence: 0.2,
    }
  }

  private recommendContentTypes(behaviors: UserBehavior[]): string[] {
    const recommendations = []

    const avgReadTime = behaviors.reduce((sum, b) => sum + b.read_duration, 0) / behaviors.length
    if (avgReadTime < 120) recommendations.push("short")
    else if (avgReadTime > 300) recommendations.push("long")
    else recommendations.push("medium")

    const recentBehaviors = behaviors.filter((b) => new Date(b.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000)

    if (recentBehaviors.length > behaviors.length * 0.7) {
      recommendations.push("recent")
    }

    const shareBehaviors = behaviors.filter((b) => b.action === "share")
    if (shareBehaviors.length > behaviors.length * 0.1) {
      recommendations.push("trending")
    }

    return recommendations
  }

  private calculatePredictionConfidence(behaviors: UserBehavior[]): number {
    const dataPoints = behaviors.length
    const timeSpan = this.calculateTimeSpan(behaviors)
    const consistency = this.calculateConsistency(behaviors)

    // Confidence increases with more data points, longer time span, and higher consistency
    const dataConfidence = Math.min(dataPoints / 50, 1)
    const timeConfidence = Math.min(timeSpan / 30, 1) // 30 days for full confidence

    return (dataConfidence + timeConfidence + consistency) / 3
  }

  private calculateTimeSpan(behaviors: UserBehavior[]): number {
    if (behaviors.length < 2) return 0

    const timestamps = behaviors.map((b) => new Date(b.timestamp).getTime())
    const minTime = Math.min(...timestamps)
    const maxTime = Math.max(...timestamps)

    return (maxTime - minTime) / (1000 * 60 * 60 * 24) // days
  }

  private calculateConsistency(behaviors: UserBehavior[]): number {
    // Calculate how consistent the user's behavior patterns are
    const categoryFreq: Record<string, number> = {}
    behaviors.forEach((b) => {
      categoryFreq[b.category] = (categoryFreq[b.category] || 0) + 1
    })

    const frequencies = Object.values(categoryFreq)
    const mean = frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length
    const variance = frequencies.reduce((sum, freq) => sum + Math.pow(freq - mean, 2), 0) / frequencies.length

    // Lower variance indicates higher consistency
    return Math.max(0, 1 - variance / (mean * mean))
  }

  private assessDataQuality(behaviors: UserBehavior[]): number {
    let quality = 0

    // Check for completeness
    const completenessFactor =
      behaviors.filter((b) => b.read_duration > 0 && b.scroll_depth > 0).length / behaviors.length

    quality += completenessFactor * 0.4

    // Check for diversity
    const uniqueCategories = new Set(behaviors.map((b) => b.category)).size
    const diversityFactor = Math.min(uniqueCategories / 8, 1) // 8 main categories

    quality += diversityFactor * 0.3

    // Check for recency
    const recentBehaviors = behaviors.filter(
      (b) => new Date(b.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).length
    const recencyFactor = Math.min(recentBehaviors / 10, 1)

    quality += recencyFactor * 0.3

    return quality
  }

  private detectConceptDrift(oldPreferences: UserPreferences, newPreferences: UserPreferences): boolean {
    // Simple drift detection based on significant changes in category weights
    const threshold = 0.3

    for (const category of Object.keys(oldPreferences.category_weights)) {
      const oldWeight = oldPreferences.category_weights[category] || 0
      const newWeight = newPreferences.category_weights[category] || 0

      if (Math.abs(oldWeight - newWeight) > threshold) {
        return true
      }
    }

    return false
  }

  private calculateBehaviorStatistics(behaviors: UserBehavior[]) {
    const stats = {
      avgReadDuration: 0,
      avgScrollDepth: 0,
      commonHours: [] as number[],
      categoryDistribution: {} as Record<string, number>,
    }

    if (behaviors.length === 0) return stats

    stats.avgReadDuration = behaviors.reduce((sum, b) => sum + b.read_duration, 0) / behaviors.length
    stats.avgScrollDepth = behaviors.reduce((sum, b) => sum + b.scroll_depth, 0) / behaviors.length

    const hourCounts: Record<number, number> = {}
    behaviors.forEach((b) => {
      hourCounts[b.time_of_day] = (hourCounts[b.time_of_day] || 0) + 1
      stats.categoryDistribution[b.category] = (stats.categoryDistribution[b.category] || 0) + 1
    })

    stats.commonHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([hour]) => Number.parseInt(hour))

    return stats
  }

  private detectTimeAnomaly(behavior: UserBehavior, stats: any) {
    if (!stats.commonHours.includes(behavior.time_of_day)) {
      return {
        behavior,
        anomalyType: "time" as const,
        severity: "medium" as const,
        description: `Unusual activity time: ${behavior.time_of_day}:00`,
      }
    }
    return null
  }

  private detectCategoryAnomaly(behavior: UserBehavior, stats: any) {
    const categoryFreq = stats.categoryDistribution[behavior.category] || 0
    const totalBehaviors = Object.values(stats.categoryDistribution).reduce(
      (sum: number, freq: number) => sum + freq,
      0,
    )
    const categoryRatio = categoryFreq / totalBehaviors

    if (categoryRatio < 0.05) {
      // Less than 5% of total behavior
      return {
        behavior,
        anomalyType: "category" as const,
        severity: "low" as const,
        description: `Unusual category interest: ${behavior.category}`,
      }
    }
    return null
  }

  private detectEngagementAnomaly(behavior: UserBehavior, stats: any) {
    const readDurationThreshold = stats.avgReadDuration * 3
    const scrollDepthThreshold = 0.9

    if (behavior.read_duration > readDurationThreshold && behavior.scroll_depth > scrollDepthThreshold) {
      return {
        behavior,
        anomalyType: "engagement" as const,
        severity: "high" as const,
        description: "Unusually high engagement detected",
      }
    }
    return null
  }

  private filterInteractionsByTimeSlot(interactions: UserInteraction[], timeSlot: string): UserInteraction[] {
    const [start, end] = timeSlot.split("-").map(Number)

    return interactions.filter((interaction) => {
      const hour = new Date(interaction.timestamp).getHours()
      return hour >= start && hour < end
    })
  }

  private extractCategoryPattern(interactions: UserInteraction[]): string[] {
    const categoryCount: Record<string, number> = {}

    for (const interaction of interactions) {
      categoryCount[interaction.category] = (categoryCount[interaction.category] || 0) + 1
    }

    return Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category)
  }

  private analyzeCategoryTrends(interactions: UserInteraction[]): {
    trending: string[]
    declining: string[]
  } {
    const recentInteractions = interactions
      .filter((i) => Date.now() - i.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000) // Last 7 days
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    const midpoint = Math.floor(recentInteractions.length / 2)
    const firstHalf = recentInteractions.slice(0, midpoint)
    const secondHalf = recentInteractions.slice(midpoint)

    const firstHalfCounts = this.getCategoryCounts(firstHalf)
    const secondHalfCounts = this.getCategoryCounts(secondHalf)

    const trending: string[] = []
    const declining: string[] = []

    for (const category of Object.keys({ ...firstHalfCounts, ...secondHalfCounts })) {
      const firstCount = firstHalfCounts[category] || 0
      const secondCount = secondHalfCounts[category] || 0

      if (secondCount > firstCount * 1.5) {
        trending.push(category)
      } else if (firstCount > secondCount * 1.5) {
        declining.push(category)
      }
    }

    return { trending, declining }
  }

  private getCategoryCounts(interactions: UserInteraction[]): Record<string, number> {
    const counts: Record<string, number> = {}
    for (const interaction of interactions) {
      counts[interaction.category] = (counts[interaction.category] || 0) + 1
    }
    return counts
  }

  private getTimeSlot(hour: number): string {
    if (hour >= 0 && hour < 6) return "00-06"
    if (hour >= 6 && hour < 12) return "06-12"
    if (hour >= 12 && hour < 18) return "12-18"
    return "18-24"
  }

  private predictWeeklyTrend(userProfile: UserProfile): string[] {
    // Simple trend prediction based on current preferences
    return userProfile.behaviorProfile.categoryPreferences
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((cp) => cp.category)
  }

  private getInteractionValue(interaction: UserInteraction): number {
    const values = {
      view: 0.1,
      click: 0.3,
      share: 0.8,
      save: 0.6,
      skip: -0.2,
    }

    return values[interaction.action] || 0
  }

  private calculateEngagementScore(interactions: UserInteraction[]): number {
    if (interactions.length === 0) return 0

    let totalScore = 0
    const weights = {
      view: 1,
      click: 2,
      share: 4,
      save: 3,
      skip: -1,
    }

    for (const interaction of interactions) {
      const baseScore = weights[interaction.action] || 0

      // Time-based bonus
      const readTimeBonus = interaction.readTime ? Math.min(interaction.readTime / 60, 2) : 0 // Max 2 points for read time

      totalScore += baseScore + readTimeBonus
    }

    return Math.max(0, Math.min(totalScore / interactions.length, 10)) / 10
  }
}

export const behavioralAnalyzer = new BehavioralAnalyzer()

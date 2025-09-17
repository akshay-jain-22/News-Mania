import type { UserBehavior, UserPreferences } from "@/types/user-profile"
import { getSupabaseClient } from "../supabase-client"

/**
 * Data Storage and Management System
 * Handles user preferences, behavior tracking, and data persistence
 */

export class PreferenceManager {
  private memoryCache: Map<string, UserPreferences> = new Map()
  private behaviorCache: Map<string, UserBehavior[]> = new Map()

  /**
   * Store user behavior data with structured format
   */
  async storeBehavior(behavior: UserBehavior): Promise<boolean> {
    try {
      const supabase = getSupabaseClient()

      if (supabase) {
        const { error } = await supabase.from("user_behaviors").insert([
          {
            user_id: behavior.user_id,
            session_id: behavior.session_id,
            article_id: behavior.article_id,
            action: behavior.action,
            timestamp: behavior.timestamp,
            time_of_day: behavior.time_of_day,
            day_of_week: behavior.day_of_week,
            read_duration: behavior.read_duration,
            scroll_depth: behavior.scroll_depth,
            device_type: behavior.device_type,
            source: behavior.source,
            category: behavior.category,
            sentiment_reaction: behavior.sentiment_reaction,
          },
        ])

        if (error) {
          console.error("Error storing behavior in Supabase:", error)
        } else {
          console.log("Behavior stored successfully in Supabase")
        }
      }

      // Always store in memory cache as fallback
      if (!this.behaviorCache.has(behavior.user_id)) {
        this.behaviorCache.set(behavior.user_id, [])
      }

      const userBehaviors = this.behaviorCache.get(behavior.user_id)!
      userBehaviors.push(behavior)

      // Keep only last 1000 behaviors per user in memory
      if (userBehaviors.length > 1000) {
        userBehaviors.splice(0, userBehaviors.length - 1000)
      }

      return true
    } catch (error) {
      console.error("Error storing behavior:", error)
      return false
    }
  }

  /**
   * Retrieve user behaviors with filtering options
   */
  async getUserBehaviors(
    userId: string,
    options: {
      limit?: number
      startDate?: string
      endDate?: string
      actions?: string[]
      categories?: string[]
    } = {},
  ): Promise<UserBehavior[]> {
    try {
      const supabase = getSupabaseClient()

      if (supabase) {
        let query = supabase
          .from("user_behaviors")
          .select("*")
          .eq("user_id", userId)
          .order("timestamp", { ascending: false })

        if (options.limit) {
          query = query.limit(options.limit)
        }

        if (options.startDate) {
          query = query.gte("timestamp", options.startDate)
        }

        if (options.endDate) {
          query = query.lte("timestamp", options.endDate)
        }

        if (options.actions && options.actions.length > 0) {
          query = query.in("action", options.actions)
        }

        if (options.categories && options.categories.length > 0) {
          query = query.in("category", options.categories)
        }

        const { data, error } = await query

        if (!error && data) {
          return data as UserBehavior[]
        }
      }

      // Fallback to memory cache
      const cachedBehaviors = this.behaviorCache.get(userId) || []
      let filteredBehaviors = [...cachedBehaviors]

      if (options.startDate) {
        const startTime = new Date(options.startDate).getTime()
        filteredBehaviors = filteredBehaviors.filter((b) => new Date(b.timestamp).getTime() >= startTime)
      }

      if (options.endDate) {
        const endTime = new Date(options.endDate).getTime()
        filteredBehaviors = filteredBehaviors.filter((b) => new Date(b.timestamp).getTime() <= endTime)
      }

      if (options.actions && options.actions.length > 0) {
        filteredBehaviors = filteredBehaviors.filter((b) => options.actions!.includes(b.action))
      }

      if (options.categories && options.categories.length > 0) {
        filteredBehaviors = filteredBehaviors.filter((b) => options.categories!.includes(b.category))
      }

      if (options.limit) {
        filteredBehaviors = filteredBehaviors.slice(0, options.limit)
      }

      return filteredBehaviors.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    } catch (error) {
      console.error("Error retrieving user behaviors:", error)
      return []
    }
  }

  /**
   * Store user preferences with versioning
   */
  async storePreferences(preferences: UserPreferences): Promise<boolean> {
    try {
      const supabase = getSupabaseClient()

      if (supabase) {
        const { error } = await supabase.from("user_preferences").upsert([
          {
            user_id: preferences.user_id,
            category_weights: preferences.category_weights,
            time_based_preferences: preferences.time_based_preferences,
            source_preferences: preferences.source_preferences,
            content_length_preference: preferences.content_length_preference,
            update_frequency: preferences.update_frequency,
            language_preferences: preferences.language_preferences,
            location_relevance: preferences.location_relevance,
            recency_preference: preferences.recency_preference,
            diversity_factor: preferences.diversity_factor,
            confidence_score: preferences.confidence_score,
            last_updated: preferences.last_updated,
          },
        ])

        if (error) {
          console.error("Error storing preferences in Supabase:", error)
        } else {
          console.log("Preferences stored successfully in Supabase")
        }
      }

      // Store in memory cache
      this.memoryCache.set(preferences.user_id, preferences)

      return true
    } catch (error) {
      console.error("Error storing preferences:", error)
      return false
    }
  }

  /**
   * Retrieve user preferences
   */
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      // Check memory cache first
      if (this.memoryCache.has(userId)) {
        return this.memoryCache.get(userId)!
      }

      const supabase = getSupabaseClient()

      if (supabase) {
        const { data, error } = await supabase.from("user_preferences").select("*").eq("user_id", userId).single()

        if (!error && data) {
          const preferences: UserPreferences = {
            user_id: data.user_id,
            category_weights: data.category_weights || {},
            time_based_preferences: data.time_based_preferences || {},
            source_preferences: data.source_preferences || {},
            content_length_preference: data.content_length_preference || "medium",
            update_frequency: data.update_frequency || "hourly",
            language_preferences: data.language_preferences || ["en"],
            location_relevance: data.location_relevance || 0.5,
            recency_preference: data.recency_preference || 0.6,
            diversity_factor: data.diversity_factor || 0.6,
            confidence_score: data.confidence_score || 0.3,
            last_updated: data.last_updated,
          }

          // Cache in memory
          this.memoryCache.set(userId, preferences)
          return preferences
        }
      }

      return null
    } catch (error) {
      console.error("Error retrieving user preferences:", error)
      return null
    }
  }

  /**
   * Export user data for analysis (Excel/CSV format)
   */
  async exportUserData(userId: string): Promise<{
    behaviors: UserBehavior[]
    preferences: UserPreferences | null
    summary: {
      totalInteractions: number
      categoriesEngaged: string[]
      averageSessionLength: number
      mostActiveHours: number[]
      preferredContentTypes: string[]
    }
  }> {
    const behaviors = await this.getUserBehaviors(userId, { limit: 10000 })
    const preferences = await this.getUserPreferences(userId)

    // Calculate summary statistics
    const summary = this.calculateUserSummary(behaviors)

    return {
      behaviors,
      preferences,
      summary,
    }
  }

  /**
   * Batch update preferences for multiple users
   */
  async batchUpdatePreferences(
    updates: Array<{ userId: string; preferences: Partial<UserPreferences> }>,
  ): Promise<boolean> {
    try {
      const supabase = getSupabaseClient()

      if (supabase) {
        const updatePromises = updates.map(async ({ userId, preferences }) => {
          const currentPreferences = await this.getUserPreferences(userId)
          if (currentPreferences) {
            const updatedPreferences = {
              ...currentPreferences,
              ...preferences,
              last_updated: new Date().toISOString(),
            }
            return this.storePreferences(updatedPreferences)
          }
          return false
        })

        const results = await Promise.all(updatePromises)
        return results.every((result) => result)
      }

      return false
    } catch (error) {
      console.error("Error in batch update:", error)
      return false
    }
  }

  /**
   * Clean old behavior data to manage storage
   */
  async cleanOldBehaviorData(retentionDays = 90): Promise<boolean> {
    try {
      const supabase = getSupabaseClient()

      if (supabase) {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

        const { error } = await supabase.from("user_behaviors").delete().lt("timestamp", cutoffDate.toISOString())

        if (error) {
          console.error("Error cleaning old behavior data:", error)
          return false
        }

        console.log(`Cleaned behavior data older than ${retentionDays} days`)
      }

      // Clean memory cache
      for (const [userId, behaviors] of this.behaviorCache.entries()) {
        const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000
        const filteredBehaviors = behaviors.filter((b) => new Date(b.timestamp).getTime() > cutoffTime)
        this.behaviorCache.set(userId, filteredBehaviors)
      }

      return true
    } catch (error) {
      console.error("Error cleaning old data:", error)
      return false
    }
  }

  /**
   * Get aggregated analytics for all users
   */
  async getGlobalAnalytics(): Promise<{
    totalUsers: number
    totalBehaviors: number
    categoryDistribution: Record<string, number>
    deviceDistribution: Record<string, number>
    hourlyActivity: Record<string, number>
    averageEngagement: number
  }> {
    try {
      const supabase = getSupabaseClient()

      if (supabase) {
        // Get total users
        const { count: totalUsers } = await supabase
          .from("user_preferences")
          .select("*", { count: "exact", head: true })

        // Get total behaviors
        const { count: totalBehaviors } = await supabase
          .from("user_behaviors")
          .select("*", { count: "exact", head: true })

        // Get category distribution
        const { data: categoryData } = await supabase.from("user_behaviors").select("category")

        // Get device distribution
        const { data: deviceData } = await supabase.from("user_behaviors").select("device_type")

        // Get hourly activity
        const { data: hourlyData } = await supabase.from("user_behaviors").select("time_of_day")

        // Calculate distributions
        const categoryDistribution: Record<string, number> = {}
        categoryData?.forEach((item) => {
          categoryDistribution[item.category] = (categoryDistribution[item.category] || 0) + 1
        })

        const deviceDistribution: Record<string, number> = {}
        deviceData?.forEach((item) => {
          deviceDistribution[item.device_type] = (deviceDistribution[item.device_type] || 0) + 1
        })

        const hourlyActivity: Record<string, number> = {}
        hourlyData?.forEach((item) => {
          const hour = item.time_of_day.toString()
          hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1
        })

        // Calculate average engagement
        const { data: engagementData } = await supabase
          .from("user_behaviors")
          .select("read_duration, scroll_depth")
          .not("read_duration", "is", null)
          .not("scroll_depth", "is", null)

        const averageEngagement =
          engagementData && engagementData.length > 0
            ? engagementData.reduce((sum, item) => sum + item.read_duration * item.scroll_depth, 0) /
              engagementData.length
            : 0

        return {
          totalUsers: totalUsers || 0,
          totalBehaviors: totalBehaviors || 0,
          categoryDistribution,
          deviceDistribution,
          hourlyActivity,
          averageEngagement,
        }
      }

      // Fallback to memory cache analysis
      return this.getMemoryCacheAnalytics()
    } catch (error) {
      console.error("Error getting global analytics:", error)
      return this.getMemoryCacheAnalytics()
    }
  }

  private calculateUserSummary(behaviors: UserBehavior[]) {
    const totalInteractions = behaviors.length
    const categoriesEngaged = [...new Set(behaviors.map((b) => b.category))]

    // Calculate average session length
    const sessions = this.groupBehaviorsBySessions(behaviors)
    const sessionLengths = sessions.map((session) => {
      if (session.length < 2) return 0
      const start = new Date(session[0].timestamp).getTime()
      const end = new Date(session[session.length - 1].timestamp).getTime()
      return (end - start) / (1000 * 60) // minutes
    })
    const averageSessionLength =
      sessionLengths.length > 0 ? sessionLengths.reduce((sum, len) => sum + len, 0) / sessionLengths.length : 0

    // Find most active hours
    const hourCounts: Record<number, number> = {}
    behaviors.forEach((b) => {
      hourCounts[b.time_of_day] = (hourCounts[b.time_of_day] || 0) + 1
    })
    const mostActiveHours = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => Number.parseInt(hour))

    // Determine preferred content types
    const readBehaviors = behaviors.filter((b) => b.action === "read")
    const avgReadTime =
      readBehaviors.length > 0 ? readBehaviors.reduce((sum, b) => sum + b.read_duration, 0) / readBehaviors.length : 0

    const preferredContentTypes = []
    if (avgReadTime < 120) preferredContentTypes.push("short")
    else if (avgReadTime > 300) preferredContentTypes.push("long")
    else preferredContentTypes.push("medium")

    const shareRate = behaviors.filter((b) => b.action === "share").length / totalInteractions
    if (shareRate > 0.1) preferredContentTypes.push("shareable")

    return {
      totalInteractions,
      categoriesEngaged,
      averageSessionLength,
      mostActiveHours,
      preferredContentTypes,
    }
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

  private getMemoryCacheAnalytics() {
    const totalUsers = this.memoryCache.size
    let totalBehaviors = 0
    const categoryDistribution: Record<string, number> = {}
    const deviceDistribution: Record<string, number> = {}
    const hourlyActivity: Record<string, number> = {}
    let totalEngagement = 0
    let engagementCount = 0

    for (const behaviors of this.behaviorCache.values()) {
      totalBehaviors += behaviors.length

      for (const behavior of behaviors) {
        // Category distribution
        categoryDistribution[behavior.category] = (categoryDistribution[behavior.category] || 0) + 1

        // Device distribution
        deviceDistribution[behavior.device_type] = (deviceDistribution[behavior.device_type] || 0) + 1

        // Hourly activity
        const hour = behavior.time_of_day.toString()
        hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1

        // Engagement
        if (behavior.read_duration > 0 && behavior.scroll_depth > 0) {
          totalEngagement += behavior.read_duration * behavior.scroll_depth
          engagementCount++
        }
      }
    }

    return {
      totalUsers,
      totalBehaviors,
      categoryDistribution,
      deviceDistribution,
      hourlyActivity,
      averageEngagement: engagementCount > 0 ? totalEngagement / engagementCount : 0,
    }
  }
}

export const preferenceManager = new PreferenceManager()

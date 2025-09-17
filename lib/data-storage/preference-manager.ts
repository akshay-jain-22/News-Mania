import type { UserProfile, UserInteraction } from "@/types/user-profile"
import { createClient } from "@supabase/supabase-js"

export class PreferenceManager {
  private supabase

  constructor() {
    this.supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  }

  /**
   * Store user preferences in structured format
   */
  async storeUserPreferences(userProfile: UserProfile): Promise<void> {
    try {
      // Store main profile
      const { error: profileError } = await this.supabase.from("user_profiles").upsert({
        id: userProfile.id,
        email: userProfile.email,
        age: userProfile.age,
        profession: userProfile.profession,
        gender: userProfile.gender,
        location: userProfile.location,
        preferences: userProfile.preferences,
        engagement_score: userProfile.behaviorProfile.engagementScore,
        created_at: userProfile.createdAt,
        updated_at: userProfile.updatedAt,
      })

      if (profileError) throw profileError

      // Store category preferences
      for (const categoryPref of userProfile.behaviorProfile.categoryPreferences) {
        await this.supabase.from("user_category_preferences").upsert({
          user_id: userProfile.id,
          category: categoryPref.category,
          score: categoryPref.score,
          confidence: categoryPref.confidence,
          last_updated: categoryPref.lastUpdated,
        })
      }

      // Store time-based preferences
      for (const timePref of userProfile.behaviorProfile.readingTimes) {
        await this.supabase.from("user_time_preferences").upsert({
          user_id: userProfile.id,
          time_slot: timePref.timeSlot,
          categories: timePref.categories,
          avg_read_time: timePref.avgReadTime,
          engagement_score: timePref.engagementScore,
        })
      }
    } catch (error) {
      console.error("Error storing user preferences:", error)
      throw error
    }
  }

  /**
   * Store user interactions for analysis
   */
  async storeUserInteraction(interaction: UserInteraction): Promise<void> {
    try {
      const { error } = await this.supabase.from("user_interactions").insert({
        user_id: interaction.articleId.split("-")[0], // Extract user ID
        article_id: interaction.articleId,
        action: interaction.action,
        timestamp: interaction.timestamp,
        read_time: interaction.readTime,
        category: interaction.category,
        time_of_day: interaction.timeOfDay,
        device_type: interaction.deviceType,
      })

      if (error) throw error
    } catch (error) {
      console.error("Error storing user interaction:", error)
      throw error
    }
  }

  /**
   * Retrieve user preferences with caching
   */
  async getUserPreferences(userId: string): Promise<UserProfile | null> {
    try {
      // Get main profile
      const { data: profile, error: profileError } = await this.supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (profileError || !profile) return null

      // Get category preferences
      const { data: categoryPrefs } = await this.supabase
        .from("user_category_preferences")
        .select("*")
        .eq("user_id", userId)

      // Get time preferences
      const { data: timePrefs } = await this.supabase.from("user_time_preferences").select("*").eq("user_id", userId)

      // Get recent interactions
      const { data: interactions } = await this.supabase
        .from("user_interactions")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })
        .limit(1000)

      // Construct UserProfile object
      const userProfile: UserProfile = {
        id: profile.id,
        email: profile.email,
        age: profile.age,
        profession: profile.profession,
        gender: profile.gender,
        location: profile.location,
        preferences: profile.preferences,
        behaviorProfile: {
          readingTimes:
            timePrefs?.map((tp) => ({
              timeSlot: tp.time_slot,
              categories: tp.categories,
              avgReadTime: tp.avg_read_time,
              engagementScore: tp.engagement_score,
            })) || [],
          categoryPreferences:
            categoryPrefs?.map((cp) => ({
              category: cp.category,
              score: cp.score,
              confidence: cp.confidence,
              lastUpdated: new Date(cp.last_updated),
            })) || [],
          interactionHistory:
            interactions?.map((i) => ({
              articleId: i.article_id,
              action: i.action,
              timestamp: new Date(i.timestamp),
              readTime: i.read_time,
              category: i.category,
              timeOfDay: i.time_of_day,
              deviceType: i.device_type,
            })) || [],
          engagementScore: profile.engagement_score || 0,
        },
        createdAt: new Date(profile.created_at),
        updatedAt: new Date(profile.updated_at),
      }

      return userProfile
    } catch (error) {
      console.error("Error retrieving user preferences:", error)
      return null
    }
  }

  /**
   * Update preference model with new data
   */
  async updatePreferenceModel(userId: string, newInteractions: UserInteraction[]): Promise<void> {
    try {
      // Store new interactions
      for (const interaction of newInteractions) {
        await this.storeUserInteraction(interaction)
      }

      // Get current user profile
      const userProfile = await this.getUserPreferences(userId)
      if (!userProfile) return

      // Update preferences using behavioral analyzer
      const { BehavioralAnalyzer } = await import("../mathematical-models/behavioral-analyzer")
      const analyzer = new BehavioralAnalyzer()

      const updatedProfile = analyzer.updateUserPreferences(userProfile, newInteractions)

      // Store updated preferences
      await this.storeUserPreferences(updatedProfile)
    } catch (error) {
      console.error("Error updating preference model:", error)
      throw error
    }
  }

  /**
   * Export user data for analysis (Excel/CSV format)
   */
  async exportUserData(userId: string): Promise<{
    profile: any
    interactions: any[]
    preferences: any[]
    timePatterns: any[]
  }> {
    try {
      const userProfile = await this.getUserPreferences(userId)
      if (!userProfile) throw new Error("User not found")

      // Get detailed interaction data
      const { data: interactions } = await this.supabase
        .from("user_interactions")
        .select("*")
        .eq("user_id", userId)
        .order("timestamp", { ascending: false })

      // Format data for export
      const exportData = {
        profile: {
          id: userProfile.id,
          age: userProfile.age,
          profession: userProfile.profession,
          gender: userProfile.gender,
          location: userProfile.location,
          engagement_score: userProfile.behaviorProfile.engagementScore,
          created_at: userProfile.createdAt,
          updated_at: userProfile.updatedAt,
        },
        interactions: interactions || [],
        preferences: userProfile.behaviorProfile.categoryPreferences,
        timePatterns: userProfile.behaviorProfile.readingTimes,
      }

      return exportData
    } catch (error) {
      console.error("Error exporting user data:", error)
      throw error
    }
  }

  /**
   * Batch update preferences for multiple users
   */
  async batchUpdatePreferences(
    updates: Array<{
      userId: string
      interactions: UserInteraction[]
    }>,
  ): Promise<void> {
    try {
      const promises = updates.map((update) => this.updatePreferenceModel(update.userId, update.interactions))

      await Promise.all(promises)
    } catch (error) {
      console.error("Error in batch update:", error)
      throw error
    }
  }

  /**
   * Clean old interaction data (data retention)
   */
  async cleanOldInteractions(retentionDays = 365): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      const { error } = await this.supabase.from("user_interactions").delete().lt("timestamp", cutoffDate.toISOString())

      if (error) throw error
    } catch (error) {
      console.error("Error cleaning old interactions:", error)
      throw error
    }
  }

  /**
   * Get aggregated analytics data
   */
  async getAnalyticsData(userId: string): Promise<{
    totalInteractions: number
    avgDailyInteractions: number
    topCategories: Array<{ category: string; count: number }>
    readingPatterns: Array<{ hour: number; count: number }>
    engagementTrend: Array<{ date: string; score: number }>
  }> {
    try {
      const { data: interactions } = await this.supabase
        .from("user_interactions")
        .select("*")
        .eq("user_id", userId)
        .gte("timestamp", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      if (!interactions) {
        return {
          totalInteractions: 0,
          avgDailyInteractions: 0,
          topCategories: [],
          readingPatterns: [],
          engagementTrend: [],
        }
      }

      // Calculate analytics
      const totalInteractions = interactions.length
      const avgDailyInteractions = totalInteractions / 30

      // Top categories
      const categoryCount: Record<string, number> = {}
      interactions.forEach((i) => {
        categoryCount[i.category] = (categoryCount[i.category] || 0) + 1
      })

      const topCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Reading patterns by hour
      const hourCount: Record<number, number> = {}
      interactions.forEach((i) => {
        const hour = new Date(i.timestamp).getHours()
        hourCount[hour] = (hourCount[hour] || 0) + 1
      })

      const readingPatterns = Object.entries(hourCount)
        .map(([hour, count]) => ({ hour: Number.parseInt(hour), count }))
        .sort((a, b) => a.hour - b.hour)

      // Engagement trend (simplified)
      const engagementTrend = this.calculateEngagementTrend(interactions)

      return {
        totalInteractions,
        avgDailyInteractions,
        topCategories,
        readingPatterns,
        engagementTrend,
      }
    } catch (error) {
      console.error("Error getting analytics data:", error)
      throw error
    }
  }

  private calculateEngagementTrend(interactions: any[]): Array<{ date: string; score: number }> {
    const dailyEngagement: Record<string, { total: number; count: number }> = {}

    interactions.forEach((interaction) => {
      const date = new Date(interaction.timestamp).toISOString().split("T")[0]
      const score = this.getEngagementScore(interaction.action)

      if (!dailyEngagement[date]) {
        dailyEngagement[date] = { total: 0, count: 0 }
      }

      dailyEngagement[date].total += score
      dailyEngagement[date].count += 1
    })

    return Object.entries(dailyEngagement)
      .map(([date, data]) => ({
        date,
        score: data.total / data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private getEngagementScore(action: string): number {
    const scores = {
      view: 1,
      click: 2,
      share: 4,
      save: 3,
      skip: 0,
    }
    return scores[action as keyof typeof scores] || 1
  }
}

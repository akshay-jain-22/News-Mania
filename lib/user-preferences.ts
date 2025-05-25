import type { UserPreferences } from "@/types/news"

// Default user preferences
const defaultPreferences: UserPreferences = {
  preferredTopics: ["general", "technology", "business"],
  preferredSources: [],
  excludedSources: [],
  language: "en",
  region: "us",
  darkMode: false,
  notificationsEnabled: true,
}

// In-memory storage for user preferences (in a real app, this would be in a database)
const userPreferencesStorage: Record<string, UserPreferences> = {}

export async function getUserPreferences(userId: string): Promise<UserPreferences> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200))

  // Return stored preferences or default
  return userPreferencesStorage[userId] || { ...defaultPreferences }
}

export async function updateUserPreferences(
  userId: string,
  updates: Partial<UserPreferences>,
): Promise<UserPreferences> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Get current preferences
  const currentPreferences = userPreferencesStorage[userId] || { ...defaultPreferences }

  // Update preferences
  const updatedPreferences = {
    ...currentPreferences,
    ...updates,
  }

  // Store updated preferences
  userPreferencesStorage[userId] = updatedPreferences

  // In a real app, you would also store these in localStorage or cookies for client-side access
  if (typeof window !== "undefined") {
    localStorage.setItem(`preferences-${userId}`, JSON.stringify(updatedPreferences))
  }

  return updatedPreferences
}

export async function syncUserPreferences(userId: string): Promise<UserPreferences> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  // In a real app, this would sync preferences between local storage and the server
  // For demo purposes, we'll just return the stored preferences

  let localPreferences: UserPreferences | null = null

  // Try to get preferences from localStorage
  if (typeof window !== "undefined") {
    const storedPreferences = localStorage.getItem(`preferences-${userId}`)
    if (storedPreferences) {
      try {
        localPreferences = JSON.parse(storedPreferences)
      } catch (error) {
        console.error("Error parsing stored preferences:", error)
      }
    }
  }

  // Get server preferences
  const serverPreferences = userPreferencesStorage[userId] || { ...defaultPreferences }

  // If we have local preferences, merge them with server preferences
  if (localPreferences) {
    const mergedPreferences = {
      ...serverPreferences,
      ...localPreferences,
    }

    // Update server storage
    userPreferencesStorage[userId] = mergedPreferences

    return mergedPreferences
  }

  return serverPreferences
}

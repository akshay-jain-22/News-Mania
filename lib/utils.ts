import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistanceToNow(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""}`
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""}`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""}`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? "s" : ""}`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""}`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears} year${diffInYears !== 1 ? "s" : ""}`
}

// Function to encrypt data before storing or transmitting
export function encryptData(data: any, key: string): string {
  // In a real app, you would use a proper encryption library
  // This is a simplified example for demonstration purposes

  // Convert data to JSON string
  const jsonString = JSON.stringify(data)

  // Base64 encode the string (not actual encryption, just for demo)
  const encodedData = btoa(jsonString)

  return encodedData
}

// Function to decrypt data
export function decryptData(encryptedData: string, key: string): any {
  // In a real app, you would use a proper decryption library
  // This is a simplified example for demonstration purposes

  try {
    // Base64 decode the string
    const jsonString = atob(encryptedData)

    // Parse the JSON string
    return JSON.parse(jsonString)
  } catch (error) {
    console.error("Error decrypting data:", error)
    return null
  }
}

// Function to extract keywords from text
export function extractKeywords(text: string): string[] {
  // In a real app, you would use NLP libraries for this
  // This is a simplified example for demonstration purposes

  if (!text) return []

  // Remove common stop words
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "is",
    "are",
    "was",
    "were",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "by",
    "about",
    "of",
  ])

  // Split text into words, convert to lowercase, and filter out stop words and short words
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .split(/\s+/)
    .filter((word) => !stopWords.has(word) && word.length > 3)

  // Count word frequency
  const wordCounts: Record<string, number> = {}
  words.forEach((word) => {
    wordCounts[word] = (wordCounts[word] || 0) + 1
  })

  // Sort by frequency and take top 10
  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
}

// Function to categorize an article using NLP
export function categorizeArticle(title: string, content: string): string[] {
  // In a real app, you would use NLP libraries or AI services for this
  // This is a simplified example for demonstration purposes

  const text = `${title} ${content}`.toLowerCase()

  const categoryKeywords: Record<string, string[]> = {
    politics: [
      "government",
      "president",
      "election",
      "congress",
      "senate",
      "vote",
      "political",
      "policy",
      "democrat",
      "republican",
    ],
    business: [
      "economy",
      "market",
      "stock",
      "company",
      "industry",
      "financial",
      "investment",
      "corporate",
      "trade",
      "economic",
    ],
    technology: [
      "tech",
      "software",
      "hardware",
      "digital",
      "internet",
      "app",
      "computer",
      "ai",
      "artificial intelligence",
      "innovation",
    ],
    health: [
      "medical",
      "health",
      "disease",
      "treatment",
      "doctor",
      "patient",
      "hospital",
      "medicine",
      "vaccine",
      "healthcare",
    ],
    science: [
      "research",
      "scientist",
      "study",
      "discovery",
      "experiment",
      "physics",
      "biology",
      "chemistry",
      "space",
      "climate",
    ],
    sports: ["game", "team", "player", "championship", "tournament", "match", "coach", "athlete", "score", "win"],
    entertainment: [
      "movie",
      "film",
      "music",
      "celebrity",
      "actor",
      "actress",
      "director",
      "show",
      "television",
      "hollywood",
    ],
  }

  // Check for category keywords in the text
  const matchedCategories = Object.entries(categoryKeywords)
    .filter(([category, keywords]) => keywords.some((keyword) => text.includes(keyword)))
    .map(([category]) => category)

  // Return matched categories or 'general' if none matched
  return matchedCategories.length > 0 ? matchedCategories : ["general"]
}

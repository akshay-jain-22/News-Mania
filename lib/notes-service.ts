import { supabase } from "@/lib/supabase-client"
import type { Note } from "@/types/notes"

export type NoteInput = {
  title: string
  content: string
  topic?: string
  articleId?: string
  articleTitle?: string
  articleUrl?: string
  isMarkdown?: boolean
  tags?: string[]
}

/**
 * Get all notes for the current user
 */
export async function getUserNotes(): Promise<Note[]> {
  try {
    console.log("Fetching user notes")
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error("Auth error:", userError)
      throw new Error("Authentication error: " + userError.message)
    }

    if (!userData.user) {
      console.error("No authenticated user found")
      throw new Error("No authenticated user found")
    }

    console.log("User authenticated, fetching notes for user:", userData.user.id)
    const { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching notes:", error)
      throw new Error("Database error: " + error.message)
    }

    console.log("Notes fetched successfully:", data?.length || 0)
    return (data || []).map((note) => ({
      id: note.id,
      userId: note.user_id,
      title: note.title || "",
      content: note.content,
      topic: note.topic || "General",
      createdAt: note.created_at,
      updatedAt: note.updated_at,
      articleId: note.article_id,
      articleTitle: note.article_title,
      articleUrl: note.article_url,
      isMarkdown: note.is_markdown || false,
      tags: Array.isArray(note.tags) ? note.tags : [],
    }))
  } catch (error) {
    console.error("Error getting user notes:", error)
    throw error
  }
}

/**
 * Get notes for a specific article
 */
export async function getNotes(articleId?: string): Promise<Note[]> {
  try {
    console.log(`Getting notes for article ${articleId}`)
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      console.error("No authenticated user found")
      return []
    }

    let query = supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })

    if (articleId) {
      query = query.eq("article_id", articleId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching notes:", error)
      return []
    }

    console.log(`Found ${data?.length || 0} notes for article ${articleId}`)
    return (data || []).map((note) => ({
      id: note.id,
      userId: note.user_id,
      title: note.title || "",
      content: note.content,
      topic: note.topic || "General",
      createdAt: note.created_at,
      updatedAt: note.updated_at,
      articleId: note.article_id,
      articleTitle: note.article_title,
      articleUrl: note.article_url,
      isMarkdown: note.is_markdown || false,
      tags: Array.isArray(note.tags) ? note.tags : [],
    }))
  } catch (error) {
    console.error("Error getting notes:", error)
    return []
  }
}

/**
 * Save a note for an article
 */
export async function saveNote(
  articleId?: string,
  content?: string,
  articleTitle?: string,
  isMarkdown?: boolean,
  articleUrl?: string,
): Promise<Note | null> {
  try {
    if (!content || content.trim() === "") {
      throw new Error("Note content is required")
    }

    console.log(`Saving note for article ${articleId}:`, content.substring(0, 50) + "...")
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error("Auth error:", userError)
      throw new Error("Authentication error: " + userError.message)
    }

    if (!userData.user) {
      throw new Error("No authenticated user found")
    }

    const tags = extractKeywords(content)

    const newNote = {
      user_id: userData.user.id,
      title: articleTitle ? `Note: ${articleTitle}` : "Note from article",
      content: content,
      topic: "News",
      article_id: articleId,
      article_title: articleTitle,
      article_url: articleUrl,
      is_markdown: isMarkdown || false,
      tags: tags,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log("Saving note to Supabase:", {
      ...newNote,
      content: newNote.content.substring(0, 50) + "...",
    })

    const { data, error } = await supabase.from("user_notes").insert(newNote).select().single()

    if (error) {
      console.error("Error saving note:", error)
      throw new Error("Database error: " + error.message)
    }

    if (!data) {
      throw new Error("No data returned from database")
    }

    console.log("Note saved successfully:", data.id)
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title || "",
      content: data.content,
      topic: data.topic || "General",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      articleId: data.article_id,
      articleTitle: data.article_title,
      articleUrl: data.article_url,
      isMarkdown: data.is_markdown || false,
      tags: Array.isArray(data.tags) ? data.tags : [],
    }
  } catch (error) {
    console.error("Error saving note:", error)
    throw error
  }
}

/**
 * Create a new note
 */
export async function createNote(noteInput: NoteInput): Promise<Note | null> {
  try {
    console.log("Creating note:", noteInput.title)
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error("Auth error:", userError)
      throw new Error("Authentication error: " + userError.message)
    }

    if (!userData.user) {
      throw new Error("No authenticated user found")
    }

    const userId = userData.user.id
    console.log("User authenticated:", userId)

    const tags = noteInput.tags || extractKeywords(noteInput.content)

    const newNote = {
      user_id: userId,
      title: noteInput.title,
      content: noteInput.content,
      topic: noteInput.topic || "General",
      article_id: noteInput.articleId || null,
      article_title: noteInput.articleTitle || null,
      article_url: noteInput.articleUrl || null,
      is_markdown: noteInput.isMarkdown || false,
      tags: tags,
    }

    console.log("Saving note to Supabase:", {
      ...newNote,
      content: newNote.content.substring(0, 50) + "...",
    })

    const { data, error } = await supabase.from("user_notes").insert(newNote).select().single()

    if (error) {
      console.error("Error creating note:", error)
      throw new Error("Database error: " + error.message)
    }

    if (!data) {
      throw new Error("No data returned from database")
    }

    console.log("Note created successfully:", data.id)
    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      content: data.content,
      topic: data.topic,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      articleId: data.article_id,
      articleTitle: data.article_title,
      articleUrl: data.article_url,
      isMarkdown: data.is_markdown || false,
      tags: Array.isArray(data.tags) ? data.tags : [],
    }
  } catch (error) {
    console.error("Error creating note:", error)
    throw error
  }
}

/**
 * Update an existing note
 */
export async function updateNote(id: string, updates: Partial<NoteInput>): Promise<Note | null> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      throw new Error("No authenticated user found")
    }

    let tags = updates.tags
    if (updates.content) {
      tags = extractKeywords(updates.content)
    }

    const updateData = {
      ...(updates.title && { title: updates.title }),
      ...(updates.content && { content: updates.content }),
      ...(updates.topic && { topic: updates.topic }),
      ...(updates.articleUrl && { article_url: updates.articleUrl }),
      ...(updates.isMarkdown !== undefined && { is_markdown: updates.isMarkdown }),
      tags,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("user_notes")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userData.user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating note:", error)
      throw new Error("Database error: " + error.message)
    }

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      content: data.content,
      topic: data.topic,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      articleId: data.article_id,
      articleTitle: data.article_title,
      articleUrl: data.article_url,
      isMarkdown: data.is_markdown || false,
      tags: Array.isArray(data.tags) ? data.tags : [],
    }
  } catch (error) {
    console.error("Error updating note:", error)
    throw error
  }
}

/**
 * Delete a note
 */
export async function deleteNote(id: string): Promise<boolean> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      throw new Error("No authenticated user found")
    }

    const { error } = await supabase.from("user_notes").delete().eq("id", id).eq("user_id", userData.user.id)

    if (error) {
      console.error("Error deleting note:", error)
      throw new Error("Database error: " + error.message)
    }

    return true
  } catch (error) {
    console.error("Error deleting note:", error)
    throw error
  }
}

/**
 * Insert sample notes for testing
 */
export async function insertSampleNotes(): Promise<boolean> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()

    if (userError || !userData.user) {
      throw new Error("No authenticated user found")
    }

    const sampleNotes = [
      {
        user_id: userData.user.id,
        title: "AI Advancements in 2024",
        content:
          "GPT-4 has shown remarkable capabilities in understanding and generating human-like text. The next frontier appears to be multimodal models that can process both text and images.",
        topic: "Technology",
        is_markdown: false,
        tags: ["ai", "gpt4", "technology", "multimodal"],
      },
      {
        user_id: userData.user.id,
        title: "The Future of Quantum Computing",
        content:
          "IBM and Google continue to make strides in quantum computing. The race to quantum supremacy is heating up with practical applications on the horizon.",
        topic: "Technology",
        is_markdown: false,
        tags: ["quantum", "computing", "ibm", "google"],
      },
      {
        user_id: userData.user.id,
        title: "Global Climate Policy",
        content:
          "Recent international agreements show promising steps toward carbon reduction, but implementation remains a challenge for many nations.",
        topic: "Politics",
        is_markdown: false,
        tags: ["climate", "policy", "carbon", "international"],
      },
      {
        user_id: userData.user.id,
        title: "Weather Report: Sunny Days Ahead",
        content:
          "The forecast for the coming week shows clear skies and temperatures in the mid-70s. Perfect weather for outdoor activities and enjoying nature.",
        topic: "Weather",
        is_markdown: false,
        tags: ["weather", "forecast", "sunny", "outdoor"],
      },
      {
        user_id: userData.user.id,
        title: "Storm Warning: Hurricane Season",
        content:
          "Meteorologists predict an active hurricane season this year. Coastal residents should prepare emergency kits and evacuation plans.",
        topic: "Weather",
        is_markdown: false,
        tags: ["weather", "hurricane", "storm", "emergency"],
      },
    ]

    const { error } = await supabase.from("user_notes").insert(sampleNotes)

    if (error) {
      console.error("Error inserting sample notes:", error)
      throw new Error("Database error: " + error.message)
    }

    console.log("Sample notes inserted successfully")
    return true
  } catch (error) {
    console.error("Error inserting sample notes:", error)
    throw error
  }
}

/**
 * Simple keyword extraction from text
 */
function extractKeywords(text: string): string[] {
  if (!text) return []

  const cleanText = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()

  const words = cleanText.split(" ")

  const commonWords = new Set([
    "the",
    "and",
    "a",
    "an",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "by",
    "about",
    "as",
    "of",
    "that",
    "this",
    "these",
    "those",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "should",
    "could",
    "may",
    "might",
    "must",
    "can",
    "from",
    "it",
    "its",
    "they",
    "them",
    "their",
    "there",
    "here",
    "where",
    "when",
    "why",
    "how",
    "what",
    "who",
    "whom",
    "which",
    "whose",
    "you",
    "your",
    "i",
    "me",
    "my",
    "we",
    "us",
    "our",
    "he",
    "him",
    "his",
    "she",
    "her",
  ])

  const keywords = words.filter((word) => word.length > 3 && !commonWords.has(word))

  const wordCounts: Record<string, number> = {}
  keywords.forEach((word) => {
    wordCounts[word] = (wordCounts[word] || 0) + 1
  })

  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)
}

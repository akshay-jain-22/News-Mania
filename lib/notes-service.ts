import { createClient } from "./supabase-client"
import type { Database } from "@/types/database"

type Note = Database["public"]["Tables"]["user_notes"]["Row"]
type NoteInsert = Database["public"]["Tables"]["user_notes"]["Insert"]

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
 * Get all notes for a specific user
 */
export async function getUserNotes(userId: string): Promise<Note[]> {
  try {
    console.log("Fetching user notes for user:", userId)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching notes:", error)
      throw error
    }

    console.log("Notes fetched successfully:", data?.length || 0)
    return data || []
  } catch (error) {
    console.error("Error getting user notes:", error)
    throw error
  }
}

/**
 * Get notes for a specific article
 */
export async function getNotesForArticle(articleId?: string): Promise<Note[]> {
  try {
    const { data: userData, error: userError } = await createClient().auth.getUser()

    if (userError || !userData.user) {
      console.error("No authenticated user found")
      return []
    }

    const userId = userData.user.id
    console.log(`Getting notes for article ${articleId} for user ${userId}`)

    let query = createClient()
      .from("user_notes")
      .select("*")
      .eq("user_id", userId)
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
    return data || []
  } catch (error) {
    console.error("Error getting notes:", error)
    return []
  }
}

/**
 * Save a note for an article
 */
export async function saveNoteForArticle(note: NoteInsert): Promise<Note> {
  try {
    if (!note.content || note.content.trim() === "") {
      throw new Error("Note content is required")
    }

    console.log(`Saving note for article ${note.article_id}:`, note.content.substring(0, 50) + "...")
    const supabase = createClient()

    const { data, error } = await supabase.from("user_notes").insert(note).select().single()

    if (error) {
      console.error("Error saving note:", error)
      throw error
    }

    console.log("Note saved successfully:", data.id)
    return data
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
    const supabase = createClient()

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
    return data
  } catch (error) {
    console.error("Error creating note:", error)
    throw error
  }
}

/**
 * Update an existing note
 */
export async function updateNoteById(noteId: string, userId: string, updates: Partial<NoteInsert>): Promise<Note> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("user_notes")
      .update(updates)
      .eq("id", noteId)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating note:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error updating note:", error)
    throw error
  }
}

/**
 * Delete a note
 */
export async function deleteNoteById(noteId: string, userId: string): Promise<void> {
  try {
    const supabase = createClient()

    const { error } = await supabase.from("user_notes").delete().eq("id", noteId).eq("user_id", userId)

    if (error) {
      console.error("Error deleting note:", error)
      throw error
    }
  } catch (error) {
    console.error("Error deleting note:", error)
    throw error
  }
}

/**
 * Insert sample notes for testing
 */
export async function insertSampleNotesForUser(userId: string): Promise<Note[]> {
  try {
    const sampleNotes = [
      {
        user_id: userId,
        title: "Welcome to NewsMania!",
        content: "This is your first note. You can save articles here with your personal thoughts and insights.",
        article_url: null,
        article_title: null,
        tags: ["welcome", "getting-started"],
      },
      {
        user_id: userId,
        title: "How to Use Notes",
        content:
          "Click the bookmark icon on any news card to save articles with your personal notes. You can organize them with tags and search through them later.",
        article_url: null,
        article_title: null,
        tags: ["tutorial", "notes"],
      },
      {
        user_id: userId,
        title: "AI Features",
        content:
          "Try the AI chat feature to ask questions about articles, get context, and fact-check information. The AI can help you understand complex news stories better.",
        article_url: null,
        article_title: null,
        tags: ["ai", "features"],
      },
    ]

    const supabase = createClient()

    const { data, error } = await supabase.from("user_notes").insert(sampleNotes).select()

    if (error) {
      console.error("Error inserting sample notes:", error)
      throw error
    }

    console.log("Sample notes inserted successfully")
    return data || []
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

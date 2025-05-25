import { supabase } from "@/lib/supabase-client"
import type { Note } from "@/types/notes"

export type NoteInput = {
  title: string
  content: string
  topic?: string
  articleId?: string
  articleTitle?: string
  isMarkdown?: boolean
  tags?: string[]
}

/**
 * Get all notes for the current user
 */
export async function getUserNotes(): Promise<Note[]> {
  try {
    console.log("Fetching user notes")
    const { data: user } = await supabase.auth.getUser()

    if (!user.user) {
      console.error("No authenticated user found")
      return []
    }

    console.log("User authenticated, fetching notes for user:", user.user.id)
    const { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", user.user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching notes:", error)
      return []
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
      isMarkdown: note.is_markdown || false,
      tags: note.tags || [],
    }))
  } catch (error) {
    console.error("Error getting user notes:", error)
    return []
  }
}

/**
 * Get notes for a specific article
 */
export async function getNotes(articleId?: string): Promise<Note[]> {
  try {
    console.log(`Getting notes for article ${articleId}`)
    const { data: user } = await supabase.auth.getUser()

    if (!user.user) {
      console.error("No authenticated user found")
      return []
    }

    let query = supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", user.user.id)
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
      isMarkdown: note.is_markdown || false,
      tags: note.tags || [],
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
): Promise<Note | null> {
  try {
    if (!content || content.trim() === "") {
      console.error("Note content is required")
      return null
    }

    console.log(`Saving note for article ${articleId}:`, content.substring(0, 50) + "...")
    const { data: user } = await supabase.auth.getUser()

    if (!user.user) {
      console.error("No authenticated user found")
      return null
    }

    // Generate tags from content
    const tags = extractKeywords(content)

    const newNote = {
      user_id: user.user.id,
      title: articleTitle || "Note from article",
      content: content,
      topic: "News",
      article_id: articleId,
      article_title: articleTitle,
      is_markdown: isMarkdown || false,
      tags: tags,
    }

    console.log("Saving note to Supabase:", {
      ...newNote,
      content: newNote.content.substring(0, 50) + "...",
    })

    const { data, error } = await supabase.from("user_notes").insert(newNote).select().single()

    if (error) {
      console.error("Error saving note:", error)
      return null
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
      isMarkdown: data.is_markdown || false,
      tags: data.tags || [],
    }
  } catch (error) {
    console.error("Error saving note:", error)
    return null
  }
}

/**
 * Create a new note
 */
export async function createNote(noteInput: NoteInput): Promise<Note | null> {
  try {
    console.log("Creating note:", noteInput.title)
    const { data: user } = await supabase.auth.getUser()

    if (!user.user) {
      console.error("No authenticated user found")
      return null
    }

    const tags = noteInput.tags || extractKeywords(noteInput.content)

    const newNote = {
      user_id: user.user.id,
      title: noteInput.title,
      content: noteInput.content,
      topic: noteInput.topic || "General",
      article_id: noteInput.articleId,
      article_title: noteInput.articleTitle,
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
      return null
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
      isMarkdown: data.is_markdown || false,
      tags: data.tags || [],
    }
  } catch (error) {
    console.error("Error creating note:", error)
    return null
  }
}

/**
 * Update an existing note
 */
export async function updateNote(id: string, updates: Partial<NoteInput>): Promise<Note | null> {
  try {
    const { data: user } = await supabase.auth.getUser()

    if (!user.user) {
      console.error("No authenticated user found")
      return null
    }

    let tags = updates.tags
    if (updates.content) {
      tags = extractKeywords(updates.content)
    }

    const updateData = {
      ...(updates.title && { title: updates.title }),
      ...(updates.content && { content: updates.content }),
      ...(updates.topic && { topic: updates.topic }),
      ...(updates.isMarkdown !== undefined && { is_markdown: updates.isMarkdown }),
      tags,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from("user_notes")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating note:", error)
      return null
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
      isMarkdown: data.is_markdown || false,
      tags: data.tags || [],
    }
  } catch (error) {
    console.error("Error updating note:", error)
    return null
  }
}

/**
 * Delete a note
 */
export async function deleteNote(id: string): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser()

    if (!user.user) {
      console.error("No authenticated user found")
      return false
    }

    const { error } = await supabase.from("user_notes").delete().eq("id", id).eq("user_id", user.user.id)

    if (error) {
      console.error("Error deleting note:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting note:", error)
    return false
  }
}

/**
 * Insert sample notes for testing
 */
export async function insertSampleNotes(): Promise<boolean> {
  try {
    const { data: user } = await supabase.auth.getUser()

    if (!user.user) {
      console.error("No authenticated user found")
      return false
    }

    const sampleNotes = [
      {
        user_id: user.user.id,
        title: "AI Advancements in 2023",
        content:
          "GPT-4 has shown remarkable capabilities in understanding and generating human-like text. The next frontier appears to be multimodal models that can process both text and images.",
        topic: "Technology",
        is_markdown: false,
        tags: ["ai", "gpt4", "technology", "multimodal"],
      },
      {
        user_id: user.user.id,
        title: "The Future of Quantum Computing",
        content:
          "IBM and Google continue to make strides in quantum computing. The race to quantum supremacy is heating up with practical applications on the horizon.",
        topic: "Technology",
        is_markdown: false,
        tags: ["quantum", "computing", "ibm", "google"],
      },
      {
        user_id: user.user.id,
        title: "Global Climate Policy",
        content:
          "Recent international agreements show promising steps toward carbon reduction, but implementation remains a challenge for many nations.",
        topic: "Politics",
        is_markdown: false,
        tags: ["climate", "policy", "carbon", "international"],
      },
    ]

    const { error } = await supabase.from("user_notes").insert(sampleNotes)

    if (error) {
      console.error("Error inserting sample notes:", error)
      return false
    }

    console.log("Sample notes inserted successfully")
    return true
  } catch (error) {
    console.error("Error inserting sample notes:", error)
    return false
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

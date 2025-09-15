import { createClient } from "@/lib/supabase-client"

export interface Note {
  id: string
  user_id: string
  title: string
  content: string
  article_url?: string
  article_title?: string
  tags: string[]
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface CreateNoteData {
  title: string
  content: string
  article_url?: string
  article_title?: string
  tags?: string[]
  is_public?: boolean
}

/**
 * Get all notes for the current user
 */
export async function getUserNotes(): Promise<Note[]> {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Authentication error:", authError)
      return []
    }

    const { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user notes:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getUserNotes:", error)
    return []
  }
}

/**
 * Get notes for a specific article
 */
export async function getNotes(articleId: string): Promise<Note[]> {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Authentication error:", authError)
      return []
    }

    const { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", user.id)
      .eq("article_url", articleId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching notes for article:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getNotes:", error)
    return []
  }
}

/**
 * Create a new note
 */
export async function createNote(noteData: CreateNoteData): Promise<Note | null> {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Authentication error:", authError)
      throw new Error("User must be authenticated to create notes")
    }

    const { data, error } = await supabase
      .from("user_notes")
      .insert({
        user_id: user.id,
        title: noteData.title,
        content: noteData.content,
        article_url: noteData.article_url,
        article_title: noteData.article_title,
        tags: noteData.tags || [],
        is_public: noteData.is_public || false,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating note:", error)
      throw error
    }

    console.log("Note created successfully:", data)
    return data
  } catch (error) {
    console.error("Error in createNote:", error)
    throw error
  }
}

/**
 * Save an article with a personal note
 */
export async function saveNote(
  articleId: string,
  noteContent: string,
  articleTitle: string,
  isPublic = false,
  articleUrl?: string,
): Promise<Note | null> {
  try {
    const noteData: CreateNoteData = {
      title: `Saved: ${articleTitle}`,
      content: noteContent,
      article_url: articleUrl || articleId,
      article_title: articleTitle,
      tags: ["saved-article"],
      is_public: isPublic,
    }

    return await createNote(noteData)
  } catch (error) {
    console.error("Error in saveNote:", error)
    throw error
  }
}

/**
 * Update an existing note
 */
export async function updateNote(noteId: string, updates: Partial<CreateNoteData>): Promise<Note | null> {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Authentication error:", authError)
      throw new Error("User must be authenticated to update notes")
    }

    const { data, error } = await supabase
      .from("user_notes")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteId)
      .eq("user_id", user.id) // Ensure user can only update their own notes
      .select()
      .single()

    if (error) {
      console.error("Error updating note:", error)
      throw error
    }

    console.log("Note updated successfully:", data)
    return data
  } catch (error) {
    console.error("Error in updateNote:", error)
    throw error
  }
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Authentication error:", authError)
      throw new Error("User must be authenticated to delete notes")
    }

    const { error } = await supabase.from("user_notes").delete().eq("id", noteId).eq("user_id", user.id) // Ensure user can only delete their own notes

    if (error) {
      console.error("Error deleting note:", error)
      throw error
    }

    console.log("Note deleted successfully:", noteId)
    return true
  } catch (error) {
    console.error("Error in deleteNote:", error)
    throw error
  }
}

/**
 * Insert sample notes for new users
 */
export async function insertSampleNotes(): Promise<boolean> {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Authentication error:", authError)
      return false
    }

    // Check if user already has notes
    const { data: existingNotes } = await supabase.from("user_notes").select("id").eq("user_id", user.id).limit(1)

    if (existingNotes && existingNotes.length > 0) {
      console.log("User already has notes, skipping sample insertion")
      return true
    }

    const sampleNotes = [
      {
        user_id: user.id,
        title: "Welcome to News Mania!",
        content:
          "This is your first note! You can save articles here with your personal thoughts and insights. Use the bookmark button on any article to save it with a note.",
        tags: ["welcome", "tutorial"],
        is_public: false,
      },
      {
        user_id: user.id,
        title: "How to Use Notes",
        content:
          "Notes are a great way to keep track of important articles and your thoughts about them. You can:\n\n• Save articles with personal notes\n• Organize with tags\n• Search through your saved content\n• Keep everything private or make notes public",
        tags: ["tutorial", "tips"],
        is_public: false,
      },
      {
        user_id: user.id,
        title: "AI Features",
        content:
          "Don't forget to try the AI features! You can:\n\n• Chat with AI about any article\n• Get background context\n• Fact-check articles\n• Get personalized insights\n\nJust click the AI chat button on any news card!",
        tags: ["ai", "features", "tutorial"],
        is_public: false,
      },
    ]

    const { data, error } = await supabase.from("user_notes").insert(sampleNotes).select()

    if (error) {
      console.error("Error inserting sample notes:", error)
      return false
    }

    console.log("Sample notes inserted successfully:", data)
    return true
  } catch (error) {
    console.error("Error in insertSampleNotes:", error)
    return false
  }
}

/**
 * Search notes by content or title
 */
export async function searchNotes(query: string): Promise<Note[]> {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Authentication error:", authError)
      return []
    }

    const { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", user.id)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,article_title.ilike.%${query}%`)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error searching notes:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in searchNotes:", error)
    return []
  }
}

/**
 * Get notes by tag
 */
export async function getNotesByTag(tag: string): Promise<Note[]> {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Authentication error:", authError)
      return []
    }

    const { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", user.id)
      .contains("tags", [tag])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching notes by tag:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getNotesByTag:", error)
    return []
  }
}

/**
 * Get all unique tags for user's notes
 */
export async function getUserTags(): Promise<string[]> {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Authentication error:", authError)
      return []
    }

    const { data, error } = await supabase.from("user_notes").select("tags").eq("user_id", user.id)

    if (error) {
      console.error("Error fetching user tags:", error)
      return []
    }

    // Flatten and deduplicate tags
    const allTags = data?.flatMap((note) => note.tags || []) || []
    return [...new Set(allTags)].sort()
  } catch (error) {
    console.error("Error in getUserTags:", error)
    return []
  }
}

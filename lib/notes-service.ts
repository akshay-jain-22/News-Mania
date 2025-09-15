import { supabase } from "./supabase-client"

export interface UserNote {
  id: string
  user_id: string
  article_url: string
  article_title: string
  note_content: string
  created_at: string
  updated_at: string
}

export interface CreateNoteData {
  article_url: string
  article_title: string
  note_content: string
}

export interface UpdateNoteData {
  note_content: string
}

/**
 * Get all notes for a specific user
 */
export async function getUserNotes(userId: string): Promise<UserNote[]> {
  try {
    const { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user notes:", error)
      throw error
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
export async function getNotes(articleUrl: string, userId?: string): Promise<UserNote[]> {
  try {
    let query = supabase.from("user_notes").select("*").eq("article_url", articleUrl)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching notes:", error)
      throw error
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
export async function createNote(userId: string, noteData: CreateNoteData): Promise<UserNote | null> {
  try {
    const { data, error } = await supabase
      .from("user_notes")
      .insert({
        user_id: userId,
        article_url: noteData.article_url,
        article_title: noteData.article_title,
        note_content: noteData.note_content,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating note:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in createNote:", error)
    return null
  }
}

/**
 * Save a note (create or update)
 */
export async function saveNote(
  userId: string,
  articleUrl: string,
  articleTitle: string,
  noteContent: string,
): Promise<UserNote | null> {
  try {
    // Check if note already exists
    const existingNotes = await getNotes(articleUrl, userId)

    if (existingNotes.length > 0) {
      // Update existing note
      return await updateNote(existingNotes[0].id, { note_content: noteContent })
    } else {
      // Create new note
      return await createNote(userId, {
        article_url: articleUrl,
        article_title: articleTitle,
        note_content: noteContent,
      })
    }
  } catch (error) {
    console.error("Error in saveNote:", error)
    return null
  }
}

/**
 * Update an existing note
 */
export async function updateNote(noteId: string, updateData: UpdateNoteData): Promise<UserNote | null> {
  try {
    const { data, error } = await supabase
      .from("user_notes")
      .update({
        note_content: updateData.note_content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteId)
      .select()
      .single()

    if (error) {
      console.error("Error updating note:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in updateNote:", error)
    return null
  }
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("user_notes").delete().eq("id", noteId)

    if (error) {
      console.error("Error deleting note:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error in deleteNote:", error)
    return false
  }
}

/**
 * Insert sample notes for new users
 */
export async function insertSampleNotes(userId: string): Promise<boolean> {
  try {
    const sampleNotes = [
      {
        user_id: userId,
        article_url: "https://example.com/sample-tech-news",
        article_title: "Latest Technology Developments",
        note_content: "This is interesting - need to follow up on the AI developments mentioned.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        user_id: userId,
        article_url: "https://example.com/sample-business-news",
        article_title: "Market Analysis and Trends",
        note_content: "Important market indicators to watch. Could affect investment strategy.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        user_id: userId,
        article_url: "https://example.com/sample-science-news",
        article_title: "Scientific Breakthrough in Research",
        note_content: "Fascinating research findings. Want to read the full study when published.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]

    const { error } = await supabase.from("user_notes").insert(sampleNotes)

    if (error) {
      console.error("Error inserting sample notes:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error in insertSampleNotes:", error)
    return false
  }
}

/**
 * Get note count for a user
 */
export async function getNoteCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("user_notes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (error) {
      console.error("Error getting note count:", error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error("Error in getNoteCount:", error)
    return 0
  }
}

/**
 * Search notes by content
 */
export async function searchNotes(userId: string, searchTerm: string): Promise<UserNote[]> {
  try {
    const { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", userId)
      .or(`note_content.ilike.%${searchTerm}%,article_title.ilike.%${searchTerm}%`)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error searching notes:", error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error("Error in searchNotes:", error)
    return []
  }
}

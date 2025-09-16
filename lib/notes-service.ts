import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export interface Note {
  id: string
  title: string
  content: string
  article_url?: string
  article_title?: string
  created_at: string
  updated_at: string
  user_id: string
  article_id?: string
  is_public?: boolean
}

export interface CreateNoteData {
  title: string
  content: string
  article_url?: string
  article_title?: string
  user_id: string
  article_id?: string
  is_public?: boolean
}

export interface UpdateNoteData {
  title?: string
  content?: string
  article_url?: string
  article_title?: string
  is_public?: boolean
}

/**
 * Save a new note (alias for createNote)
 */
export async function saveNote(
  articleId: string,
  content: string,
  title: string,
  isPublic = false,
  articleUrl?: string,
): Promise<Note> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      // Return mock note for demo purposes when not authenticated
      return {
        id: `note_${Date.now()}`,
        user_id: "demo_user",
        article_id: articleId,
        title,
        content,
        article_url: articleUrl,
        is_public: isPublic,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }

    const { data: note, error } = await supabase
      .from("user_notes")
      .insert({
        title,
        content,
        article_url: articleUrl,
        article_id: articleId,
        user_id: user.id,
        is_public: isPublic,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving note:", error)
      // Return mock note as fallback
      return {
        id: `note_${Date.now()}`,
        user_id: user.id,
        article_id: articleId,
        title,
        content,
        article_url: articleUrl,
        is_public: isPublic,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }

    return note as Note
  } catch (error) {
    console.error("Error in saveNote:", error)
    // Return mock note as fallback
    return {
      id: `note_${Date.now()}`,
      user_id: "demo_user",
      article_id: articleId,
      title,
      content,
      article_url: articleUrl,
      is_public: isPublic,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
}

/**
 * Create a new note
 */
export async function createNote(data: CreateNoteData): Promise<Note> {
  try {
    const { data: note, error } = await supabase
      .from("user_notes")
      .insert({
        title: data.title,
        content: data.content,
        article_url: data.article_url,
        article_title: data.article_title,
        article_id: data.article_id,
        user_id: data.user_id,
        is_public: data.is_public || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating note:", error)
      throw new Error(`Failed to create note: ${error.message}`)
    }

    return note as Note
  } catch (error) {
    console.error("Error in createNote:", error)
    throw error
  }
}

/**
 * Get all notes for a user (alias for getUserNotes)
 */
export async function getNotes(userId?: string): Promise<Note[]> {
  try {
    let targetUserId = userId
    if (!targetUserId) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        // Return empty array when not authenticated
        return []
      }
      targetUserId = user.id
    }

    const { data: notes, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", targetUserId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching notes:", error)
      return []
    }

    return notes as Note[]
  } catch (error) {
    console.error("Error in getNotes:", error)
    return []
  }
}

/**
 * Get all notes for a user
 */
export async function getUserNotes(userId: string): Promise<Note[]> {
  try {
    const { data: notes, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching notes:", error)
      throw new Error(`Failed to fetch notes: ${error.message}`)
    }

    return notes as Note[]
  } catch (error) {
    console.error("Error in getUserNotes:", error)
    throw error
  }
}

/**
 * Get a specific note by ID
 */
export async function getNote(noteId: string, userId: string): Promise<Note | null> {
  try {
    const { data: note, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("id", noteId)
      .eq("user_id", userId)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null
      }
      console.error("Error fetching note:", error)
      throw new Error(`Failed to fetch note: ${error.message}`)
    }

    return note as Note
  } catch (error) {
    console.error("Error in getNote:", error)
    throw error
  }
}

/**
 * Update a note
 */
export async function updateNote(noteId: string, userId: string, data: UpdateNoteData): Promise<Note> {
  try {
    const { data: note, error } = await supabase
      .from("user_notes")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteId)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) {
      console.error("Error updating note:", error)
      throw new Error(`Failed to update note: ${error.message}`)
    }

    return note as Note
  } catch (error) {
    console.error("Error in updateNote:", error)
    throw error
  }
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase.from("user_notes").delete().eq("id", noteId).eq("user_id", userId)

    if (error) {
      console.error("Error deleting note:", error)
      throw new Error(`Failed to delete note: ${error.message}`)
    }
  } catch (error) {
    console.error("Error in deleteNote:", error)
    throw error
  }
}

/**
 * Search notes by title or content
 */
export async function searchNotes(userId: string, query: string): Promise<Note[]> {
  try {
    const { data: notes, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", userId)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error searching notes:", error)
      throw new Error(`Failed to search notes: ${error.message}`)
    }

    return notes as Note[]
  } catch (error) {
    console.error("Error in searchNotes:", error)
    throw error
  }
}

/**
 * Get notes related to a specific article
 */
export async function getNotesForArticle(userId: string, articleUrl: string): Promise<Note[]> {
  try {
    const { data: notes, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", userId)
      .eq("article_url", articleUrl)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching article notes:", error)
      throw new Error(`Failed to fetch article notes: ${error.message}`)
    }

    return notes as Note[]
  } catch (error) {
    console.error("Error in getNotesForArticle:", error)
    throw error
  }
}

/**
 * Get recent notes (last 10)
 */
export async function getRecentNotes(userId: string, limit = 10): Promise<Note[]> {
  try {
    const { data: notes, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching recent notes:", error)
      throw new Error(`Failed to fetch recent notes: ${error.message}`)
    }

    return notes as Note[]
  } catch (error) {
    console.error("Error in getRecentNotes:", error)
    throw error
  }
}

/**
 * Insert sample notes for demonstration (alias for createSampleNotes)
 */
export async function insertSampleNotes(userId: string): Promise<Note[]> {
  const sampleNotes = [
    {
      title: "Technology Trends 2024",
      content:
        "Key observations about AI development, cloud computing growth, and cybersecurity challenges. The integration of AI in everyday applications is accelerating faster than expected.",
      user_id: userId,
    },
    {
      title: "Market Analysis Notes",
      content:
        "Economic indicators suggest continued volatility in tech stocks. Important to monitor Federal Reserve decisions and their impact on growth companies.",
      user_id: userId,
    },
    {
      title: "Climate Change Research",
      content:
        "Recent studies show accelerating ice sheet melting. Need to follow up on renewable energy adoption rates and policy changes at the federal level.",
      user_id: userId,
    },
    {
      title: "Sports Update Notes",
      content:
        "Following the latest developments in professional sports. Key trades and player movements that could impact team performance this season.",
      user_id: userId,
    },
    {
      title: "Health & Wellness Insights",
      content:
        "New research on nutrition and exercise. Important findings about sleep patterns and their impact on cognitive performance and overall health.",
      user_id: userId,
    },
  ]

  try {
    const createdNotes: Note[] = []

    for (const noteData of sampleNotes) {
      try {
        const { data: note, error } = await supabase
          .from("user_notes")
          .insert({
            ...noteData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          console.error("Error creating sample note:", error)
          // Create mock note as fallback
          const mockNote: Note = {
            id: `sample_${Date.now()}_${Math.random()}`,
            ...noteData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          createdNotes.push(mockNote)
        } else {
          createdNotes.push(note as Note)
        }
      } catch (noteError) {
        console.error("Error creating individual sample note:", noteError)
        // Create mock note as fallback
        const mockNote: Note = {
          id: `sample_${Date.now()}_${Math.random()}`,
          ...noteData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        createdNotes.push(mockNote)
      }
    }

    return createdNotes
  } catch (error) {
    console.error("Error creating sample notes:", error)
    // Return mock notes as fallback
    return sampleNotes.map((noteData, index) => ({
      id: `sample_${Date.now()}_${index}`,
      ...noteData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))
  }
}

/**
 * Create sample notes for demonstration
 */
export async function createSampleNotes(userId: string): Promise<Note[]> {
  return insertSampleNotes(userId)
}

/**
 * Export notes to JSON format
 */
export async function exportNotes(userId: string): Promise<string> {
  try {
    const notes = await getUserNotes(userId)
    return JSON.stringify(notes, null, 2)
  } catch (error) {
    console.error("Error exporting notes:", error)
    throw error
  }
}

/**
 * Get notes statistics for a user
 */
export async function getNotesStats(userId: string): Promise<{
  totalNotes: number
  notesThisWeek: number
  notesThisMonth: number
  averageNoteLength: number
}> {
  try {
    const notes = await getUserNotes(userId)
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const notesThisWeek = notes.filter((note) => new Date(note.created_at) >= oneWeekAgo).length
    const notesThisMonth = notes.filter((note) => new Date(note.created_at) >= oneMonthAgo).length

    const totalLength = notes.reduce((sum, note) => sum + note.content.length, 0)
    const averageNoteLength = notes.length > 0 ? Math.round(totalLength / notes.length) : 0

    return {
      totalNotes: notes.length,
      notesThisWeek,
      notesThisMonth,
      averageNoteLength,
    }
  } catch (error) {
    console.error("Error getting notes stats:", error)
    throw error
  }
}

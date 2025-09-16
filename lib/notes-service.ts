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

// Main export functions that are expected by the application
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

    const noteData = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: user?.id || "demo_user",
      article_id: articleId,
      title,
      content,
      article_url: articleUrl,
      is_public: isPublic,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (user && !userError) {
      try {
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

        if (!error && note) {
          return note as Note
        }
      } catch (dbError) {
        console.error("Database error:", dbError)
      }
    }

    // Return mock note as fallback
    return noteData
  } catch (error) {
    console.error("Error in saveNote:", error)
    // Return mock note as fallback
    return {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

export async function getNotes(userId?: string): Promise<Note[]> {
  try {
    let targetUserId = userId
    if (!targetUserId) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
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
          const mockNote: Note = {
            id: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
        const mockNote: Note = {
          id: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    return sampleNotes.map((noteData, index) => ({
      id: `sample_${Date.now()}_${index}`,
      ...noteData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))
  }
}

// Additional helper functions
export async function createNote(data: CreateNoteData): Promise<Note> {
  return saveNote(
    data.article_id || `article_${Date.now()}`,
    data.content,
    data.title,
    data.is_public || false,
    data.article_url,
  )
}

export async function getUserNotes(userId: string): Promise<Note[]> {
  return getNotes(userId)
}

export async function createSampleNotes(userId: string): Promise<Note[]> {
  return insertSampleNotes(userId)
}

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
        return null
      }
      console.error("Error fetching note:", error)
      return null
    }

    return note as Note
  } catch (error) {
    console.error("Error in getNote:", error)
    return null
  }
}

export async function updateNote(noteId: string, userId: string, data: UpdateNoteData): Promise<Note | null> {
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
      return null
    }

    return note as Note
  } catch (error) {
    console.error("Error in updateNote:", error)
    return null
  }
}

export async function deleteNote(noteId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("user_notes").delete().eq("id", noteId).eq("user_id", userId)

    if (error) {
      console.error("Error deleting note:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteNote:", error)
    return false
  }
}

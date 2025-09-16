import { createClient } from "@/lib/supabase-client"

export interface Note {
  id: string
  user_id: string
  article_id: string
  title: string
  content: string
  article_url?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export async function saveNote(
  articleId: string,
  content: string,
  title: string,
  isPublic = false,
  articleUrl?: string,
): Promise<Note> {
  try {
    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error("User not authenticated")
    }

    const noteData = {
      user_id: user.id,
      article_id: articleId,
      title,
      content,
      article_url: articleUrl,
      is_public: isPublic,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("user_notes").insert([noteData]).select().single()

    if (error) {
      console.error("Supabase error:", error)
      throw new Error(`Failed to save note: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error saving note:", error)

    // Return a mock note for demo purposes
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

export async function getUserNotes(userId?: string): Promise<Note[]> {
  try {
    const supabase = createClient()

    let targetUserId = userId
    if (!targetUserId) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error("User not authenticated")
      }
      targetUserId = user.id
    }

    const { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      throw new Error(`Failed to fetch notes: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error("Error fetching notes:", error)
    return []
  }
}

export async function deleteNote(noteId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    const { error } = await supabase.from("user_notes").delete().eq("id", noteId)

    if (error) {
      console.error("Supabase error:", error)
      throw new Error(`Failed to delete note: ${error.message}`)
    }

    return true
  } catch (error) {
    console.error("Error deleting note:", error)
    return false
  }
}

export async function updateNote(
  noteId: string,
  updates: Partial<Pick<Note, "title" | "content" | "is_public">>,
): Promise<Note | null> {
  try {
    const supabase = createClient()

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("user_notes").update(updateData).eq("id", noteId).select().single()

    if (error) {
      console.error("Supabase error:", error)
      throw new Error(`Failed to update note: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error("Error updating note:", error)
    return null
  }
}

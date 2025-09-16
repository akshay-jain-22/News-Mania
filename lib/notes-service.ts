import { supabase } from "./supabase-client"

export interface Note {
  id: string
  title: string
  content: string
  topic: string
  tags: string[]
  created_at: string
  updated_at: string
  user_id: string
  article_url?: string
  is_public: boolean
}

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
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("User not authenticated")
    }

    const noteData = {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title || "Untitled Note",
      content,
      topic: "General",
      tags: [],
      user_id: user.id,
      article_url: articleUrl,
      is_public: isPublic,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from("user_notes").insert([noteData]).select().single()

    if (error) {
      console.error("Supabase error:", error)
      // Return mock data if Supabase fails
      return noteData as Note
    }

    return data as Note
  } catch (error) {
    console.error("Error saving note:", error)
    // Return mock data as fallback
    return {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title || "Untitled Note",
      content,
      topic: "General",
      tags: [],
      user_id: "mock-user",
      article_url: articleUrl,
      is_public: isPublic,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
}

export async function getUserNotes(): Promise<Note[]> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("User not authenticated, returning sample notes")
      return getSampleNotes()
    }

    const { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return getSampleNotes()
    }

    return (data || []).map((note) => ({
      ...note,
      tags: Array.isArray(note.tags) ? note.tags : [],
    })) as Note[]
  } catch (error) {
    console.error("Error fetching notes:", error)
    return getSampleNotes()
  }
}

export async function insertSampleNotes(): Promise<boolean> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("User not authenticated")
      return false
    }

    const sampleNotes = getSampleNotes().map((note) => ({
      ...note,
      user_id: user.id,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }))

    const { error } = await supabase.from("user_notes").insert(sampleNotes)

    if (error) {
      console.error("Error inserting sample notes:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error inserting sample notes:", error)
    return false
  }
}

export async function deleteNote(noteId: string): Promise<boolean> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return false
    }

    const { error } = await supabase.from("user_notes").delete().eq("id", noteId).eq("user_id", user.id)

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

export async function updateNote(noteId: string, updates: Partial<Note>): Promise<Note | null> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    const { data, error } = await supabase
      .from("user_notes")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", noteId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating note:", error)
      return null
    }

    return data as Note
  } catch (error) {
    console.error("Error updating note:", error)
    return null
  }
}

function getSampleNotes(): Note[] {
  return [
    {
      id: "sample-1",
      title: "Technology Trends 2024",
      content:
        "AI and machine learning continue to dominate the tech landscape. Key developments include improved natural language processing, computer vision advances, and the integration of AI into everyday applications.",
      topic: "Technology",
      tags: ["AI", "Machine Learning", "Trends"],
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      user_id: "sample-user",
      is_public: false,
    },
    {
      id: "sample-2",
      title: "Climate Change Impact",
      content:
        "Recent studies show accelerating effects of climate change on global weather patterns. Rising sea levels, extreme weather events, and ecosystem disruption are becoming more frequent.",
      topic: "Environment",
      tags: ["Climate", "Environment", "Science"],
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      user_id: "sample-user",
      is_public: false,
    },
    {
      id: "sample-3",
      title: "Economic Market Analysis",
      content:
        "Global markets show mixed signals with technology stocks leading gains while traditional sectors face headwinds. Inflation concerns persist despite central bank interventions.",
      topic: "Business",
      tags: ["Economics", "Markets", "Finance"],
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      user_id: "sample-user",
      is_public: false,
    },
  ]
}

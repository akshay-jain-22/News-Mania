import { supabase } from "./supabase-client"
import type { Note, CreateNoteData } from "@/types/notes"

// In-memory storage for notes (fallback when Supabase is not available)
let notesStorage: Note[] = []
let nextId = 1

export async function saveNote(noteData: CreateNoteData): Promise<Note> {
  try {
    console.log("Saving note:", noteData.title)

    // Create new note
    const newNote: Note = {
      id: `note-${nextId++}`,
      title: noteData.title,
      content: noteData.content,
      topic: noteData.articleId || "General",
      tags: noteData.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "anonymous", // Fallback user ID
      article_url: noteData.articleUrl,
      is_public: noteData.isPublic || false,
    }

    // Add to storage
    notesStorage.push(newNote)

    console.log("Note saved successfully:", newNote.id)
    return newNote
  } catch (error) {
    console.error("Error saving note:", error)
    throw new Error("Failed to save note")
  }
}

export async function createNote(noteData: CreateNoteData): Promise<Note> {
  try {
    console.log("Creating note:", noteData.title)

    // Create new note with proper structure
    const newNote: Note = {
      id: `note-${nextId++}`,
      title: noteData.title,
      content: noteData.content,
      topic: noteData.articleId || "General",
      tags: noteData.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "anonymous", // Fallback user ID
      article_url: noteData.articleUrl,
      is_public: noteData.isPublic || false,
    }

    // Try to save to Supabase first
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (!authError && user) {
        const supabaseNote = {
          user_id: user.id,
          title: noteData.title,
          content: noteData.content,
          topic: noteData.articleId || "General",
          tags: noteData.tags || [],
          article_url: noteData.articleUrl,
          is_public: noteData.isPublic || false,
        }

        const { data, error } = await supabase.from("user_notes").insert(supabaseNote).select().single()

        if (!error && data) {
          const savedNote: Note = {
            id: data.id,
            title: data.title,
            content: data.content,
            topic: data.topic,
            tags: Array.isArray(data.tags) ? data.tags : [],
            created_at: data.created_at,
            updated_at: data.updated_at,
            user_id: data.user_id,
            article_url: data.article_url,
            is_public: data.is_public,
          }

          // Also add to local storage
          notesStorage.push(savedNote)
          return savedNote
        }
      }
    } catch (supabaseError) {
      console.warn("Supabase save failed, using local storage:", supabaseError)
    }

    // Add to local storage as fallback
    notesStorage.push(newNote)

    console.log("Note created successfully:", newNote.id)
    return newNote
  } catch (error) {
    console.error("Error creating note:", error)
    throw new Error("Failed to create note")
  }
}

export async function getUserNotes(): Promise<Note[]> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("User not authenticated, returning local notes")
      return notesStorage.slice().reverse() // Most recent first
    }

    const { data, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return notesStorage.slice().reverse() // Most recent first
    }

    return (data || []).map((note) => ({
      ...note,
      tags: Array.isArray(note.tags) ? note.tags : [],
    })) as Note[]
  } catch (error) {
    console.error("Error fetching notes:", error)
    return notesStorage.slice().reverse() // Most recent first
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
      id: `note-${nextId++}`,
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
      // Remove from local storage
      const noteIndex = notesStorage.findIndex((note) => note.id === noteId)
      if (noteIndex !== -1) {
        notesStorage.splice(noteIndex, 1)
        return true
      }
      return false
    }

    const { error } = await supabase.from("user_notes").delete().eq("id", noteId).eq("user_id", user.id)

    if (error) {
      console.error("Error deleting note:", error)
      return false
    }

    // Remove from local storage
    const noteIndex = notesStorage.findIndex((note) => note.id === noteId)
    if (noteIndex !== -1) {
      notesStorage.splice(noteIndex, 1)
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
      // Update in local storage
      const noteIndex = notesStorage.findIndex((note) => note.id === noteId)
      if (noteIndex !== -1) {
        const existingNote = notesStorage[noteIndex]
        const updatedNote: Note = {
          ...existingNote,
          ...updates,
          updated_at: new Date().toISOString(),
        }
        notesStorage[noteIndex] = updatedNote
        return updatedNote
      }
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

    // Update in local storage
    const noteIndex = notesStorage.findIndex((note) => note.id === noteId)
    if (noteIndex !== -1) {
      const existingNote = notesStorage[noteIndex]
      const updatedNote: Note = {
        ...existingNote,
        ...updates,
        updated_at: new Date().toISOString(),
      }
      notesStorage[noteIndex] = updatedNote
    }

    return data as Note
  } catch (error) {
    console.error("Error updating note:", error)
    return null
  }
}

export async function getNotes(userId?: string): Promise<Note[]> {
  try {
    console.log("Fetching notes for user:", userId || "anonymous")

    // Return all notes from storage
    return notesStorage.slice().reverse() // Most recent first
  } catch (error) {
    console.error("Error fetching notes:", error)
    return []
  }
}

export async function getNoteById(id: string): Promise<Note | null> {
  try {
    console.log("Fetching note by ID:", id)

    const note = notesStorage.find((note) => note.id === id)
    return note || null
  } catch (error) {
    console.error("Error fetching note by ID:", error)
    return null
  }
}

export async function searchNotes(query: string, userId?: string): Promise<Note[]> {
  try {
    console.log("Searching notes with query:", query)

    const lowercaseQuery = query.toLowerCase()
    const filteredNotes = notesStorage.filter(
      (note) =>
        note.title.toLowerCase().includes(lowercaseQuery) ||
        note.content.toLowerCase().includes(lowercaseQuery) ||
        note.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery)),
    )

    return filteredNotes.reverse() // Most recent first
  } catch (error) {
    console.error("Error searching notes:", error)
    return []
  }
}

export async function getNotesByTag(tag: string, userId?: string): Promise<Note[]> {
  try {
    console.log("Fetching notes by tag:", tag)

    const filteredNotes = notesStorage.filter((note) => note.tags.includes(tag))

    return filteredNotes.reverse() // Most recent first
  } catch (error) {
    console.error("Error fetching notes by tag:", error)
    return []
  }
}

export async function getAllTags(userId?: string): Promise<string[]> {
  try {
    console.log("Fetching all tags for user:", userId || "anonymous")

    const allTags = new Set<string>()
    notesStorage.forEach((note) => {
      note.tags.forEach((tag) => allTags.add(tag))
    })

    return Array.from(allTags).sort()
  } catch (error) {
    console.error("Error fetching tags:", error)
    return []
  }
}

function getSampleNotes(): Note[] {
  return [
    {
      id: "sample-1",
      title: "Welcome to News Notes",
      content: "This is your first note! You can save articles, add your thoughts, and organize them with tags.",
      tags: ["welcome", "tutorial"],
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      user_id: "sample-user",
      is_public: false,
    },
    {
      id: "sample-2",
      title: "AI Technology Trends",
      content:
        "Interesting developments in AI technology. The integration of machine learning in news analysis is becoming more sophisticated.",
      tags: ["ai", "technology", "trends"],
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      user_id: "sample-user",
      is_public: false,
    },
    {
      id: "sample-3",
      title: "Climate Change Impact",
      content:
        "Recent studies show accelerating effects of climate change on global weather patterns. Rising sea levels and extreme weather events are becoming more frequent.",
      tags: ["climate", "environment", "science"],
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      user_id: "sample-user",
      is_public: false,
    },
  ]
}

// Initialize with some sample notes
export function initializeSampleNotes() {
  if (notesStorage.length === 0) {
    notesStorage = getSampleNotes()
    nextId = 4
  }
}

// Initialize sample notes on module load
initializeSampleNotes()

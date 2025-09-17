import { createClient } from "@supabase/supabase-js"

// Types
export interface Note {
  id: string
  title: string
  content: string
  topic?: string
  tags: string[]
  article_url?: string
  article_title?: string
  created_at: string
  updated_at: string
  user_id?: string
  is_public?: boolean
}

export interface CreateNoteData {
  title: string
  content: string
  articleId?: string
  articleUrl?: string
  articleTitle?: string
  tags?: string[]
  isPublic?: boolean
}

// In-memory storage for fallback
let memoryNotes: Note[] = []
let nextId = 1

// Initialize Supabase client with fallback handling
function getSupabaseClient() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials not found, using fallback storage")
      return null
    }

    return createClient(supabaseUrl, supabaseKey)
  } catch (error) {
    console.warn("Failed to initialize Supabase client:", error)
    return null
  }
}

// Generate unique ID for fallback storage
function generateId(): string {
  return `note-${nextId++}`
}

// Create a new note
export async function createNote(noteData: CreateNoteData): Promise<Note> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const noteToInsert = {
        title: noteData.title,
        content: noteData.content,
        topic: noteData.articleId || "General",
        tags: noteData.tags || [],
        article_url: noteData.articleUrl,
        article_title: noteData.articleTitle,
        is_public: noteData.isPublic || false,
        user_id: user?.id || "anonymous",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase.from("user_notes").insert([noteToInsert]).select().single()

      if (error) throw error

      const createdNote: Note = {
        id: data.id,
        title: data.title,
        content: data.content,
        topic: data.topic,
        tags: Array.isArray(data.tags) ? data.tags : [],
        article_url: data.article_url,
        article_title: data.article_title,
        created_at: data.created_at,
        updated_at: data.updated_at,
        user_id: data.user_id,
        is_public: data.is_public,
      }

      // Also add to memory storage
      memoryNotes.push(createdNote)
      return createdNote
    } catch (error) {
      console.warn("Supabase createNote failed, using fallback:", error)
    }
  }

  // Fallback to memory storage
  const note: Note = {
    id: generateId(),
    title: noteData.title,
    content: noteData.content,
    topic: noteData.articleId || "General",
    tags: noteData.tags || [],
    article_url: noteData.articleUrl,
    article_title: noteData.articleTitle,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: "anonymous",
    is_public: noteData.isPublic || false,
  }

  memoryNotes.push(note)
  return note
}

// Save a note (alias for createNote for backward compatibility)
export async function saveNote(noteData: CreateNoteData): Promise<Note> {
  return createNote(noteData)
}

// Get all notes for a user
export async function getUserNotes(userId?: string): Promise<Note[]> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const targetUserId = userId || user?.id

      if (targetUserId) {
        const { data, error } = await supabase
          .from("user_notes")
          .select("*")
          .eq("user_id", targetUserId)
          .order("created_at", { ascending: false })

        if (error) throw error

        return (data || []).map((note) => ({
          ...note,
          tags: Array.isArray(note.tags) ? note.tags : [],
        })) as Note[]
      }
    } catch (error) {
      console.warn("Supabase getUserNotes failed, using fallback:", error)
    }
  }

  // Fallback to memory storage
  return memoryNotes
    .filter((note) => !userId || note.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// Get all notes (without user filtering) - REQUIRED EXPORT
export async function getNotes(userId?: string): Promise<Note[]> {
  return getUserNotes(userId)
}

// Get all notes (alternative implementation)
export async function getAllNotes(): Promise<Note[]> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const { data, error } = await supabase.from("user_notes").select("*").order("created_at", { ascending: false })

      if (error) throw error

      return (data || []).map((note) => ({
        ...note,
        tags: Array.isArray(note.tags) ? note.tags : [],
      })) as Note[]
    } catch (error) {
      console.warn("Supabase getAllNotes failed, using fallback:", error)
    }
  }

  // Fallback to memory storage
  return memoryNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// Insert sample notes - REQUIRED EXPORT
export async function insertSampleNotes(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    if (supabase) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const sampleNotes = getSampleNotesData().map((note) => ({
            ...note,
            user_id: user.id,
          }))

          const { error } = await supabase.from("user_notes").insert(sampleNotes)

          if (error) {
            console.error("Error inserting sample notes to Supabase:", error)
          } else {
            console.log("Sample notes inserted successfully to Supabase")
            return true
          }
        }
      } catch (supabaseError) {
        console.warn("Supabase insertSampleNotes failed, using fallback:", supabaseError)
      }
    }

    // Fallback: add sample notes to memory storage
    const sampleNotes = getSampleNotesData().map((noteData) => ({
      ...noteData,
      id: generateId(),
      user_id: "anonymous",
    }))

    memoryNotes.push(...sampleNotes)
    console.log("Sample notes added to memory storage")
    return true
  } catch (error) {
    console.error("Error inserting sample notes:", error)
    return false
  }
}

// Update a note
export async function updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("user_notes")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      // Update memory storage too
      const noteIndex = memoryNotes.findIndex((note) => note.id === id)
      if (noteIndex !== -1) {
        memoryNotes[noteIndex] = {
          ...memoryNotes[noteIndex],
          ...updates,
          updated_at: new Date().toISOString(),
        }
      }

      return {
        ...data,
        tags: Array.isArray(data.tags) ? data.tags : [],
      } as Note
    } catch (error) {
      console.warn("Supabase updateNote failed, using fallback:", error)
    }
  }

  // Fallback to memory storage
  const noteIndex = memoryNotes.findIndex((note) => note.id === id)
  if (noteIndex !== -1) {
    memoryNotes[noteIndex] = {
      ...memoryNotes[noteIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    }
    return memoryNotes[noteIndex]
  }

  return null
}

// Delete a note
export async function deleteNote(id: string): Promise<boolean> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const { error } = await supabase.from("user_notes").delete().eq("id", id)

      if (error) throw error

      // Remove from memory storage too
      const noteIndex = memoryNotes.findIndex((note) => note.id === id)
      if (noteIndex !== -1) {
        memoryNotes.splice(noteIndex, 1)
      }

      return true
    } catch (error) {
      console.warn("Supabase deleteNote failed, using fallback:", error)
    }
  }

  // Fallback to memory storage
  const noteIndex = memoryNotes.findIndex((note) => note.id === id)
  if (noteIndex !== -1) {
    memoryNotes.splice(noteIndex, 1)
    return true
  }

  return false
}

// Get a single note by ID
export async function getNoteById(id: string): Promise<Note | null> {
  const supabase = getSupabaseClient()

  if (supabase) {
    try {
      const { data, error } = await supabase.from("user_notes").select("*").eq("id", id).single()

      if (error) throw error

      return {
        ...data,
        tags: Array.isArray(data.tags) ? data.tags : [],
      } as Note
    } catch (error) {
      console.warn("Supabase getNoteById failed, using fallback:", error)
    }
  }

  // Fallback to memory storage
  return memoryNotes.find((note) => note.id === id) || null
}

// Search notes by content or title
export async function searchNotes(query: string, userId?: string): Promise<Note[]> {
  const supabase = getSupabaseClient()

  if (supabase && userId) {
    try {
      const { data, error } = await supabase
        .from("user_notes")
        .select("*")
        .eq("user_id", userId)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data || []).map((note) => ({
        ...note,
        tags: Array.isArray(note.tags) ? note.tags : [],
      })) as Note[]
    } catch (error) {
      console.warn("Supabase searchNotes failed, using fallback:", error)
    }
  }

  // Fallback to memory storage
  const lowercaseQuery = query.toLowerCase()
  return memoryNotes
    .filter((note) => {
      const matchesQuery =
        note.title.toLowerCase().includes(lowercaseQuery) ||
        note.content.toLowerCase().includes(lowercaseQuery) ||
        note.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))

      const matchesUser = !userId || note.user_id === userId

      return matchesQuery && matchesUser
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// Get notes by article URL
export async function getNotesByArticle(articleUrl: string, userId?: string): Promise<Note[]> {
  const supabase = getSupabaseClient()

  if (supabase && userId) {
    try {
      const { data, error } = await supabase
        .from("user_notes")
        .select("*")
        .eq("user_id", userId)
        .eq("article_url", articleUrl)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data || []).map((note) => ({
        ...note,
        tags: Array.isArray(note.tags) ? note.tags : [],
      })) as Note[]
    } catch (error) {
      console.warn("Supabase getNotesByArticle failed, using fallback:", error)
    }
  }

  // Fallback to memory storage
  return memoryNotes
    .filter((note) => {
      const matchesUrl = note.article_url === articleUrl
      const matchesUser = !userId || note.user_id === userId
      return matchesUrl && matchesUser
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// Get notes by tag
export async function getNotesByTag(tag: string, userId?: string): Promise<Note[]> {
  const supabase = getSupabaseClient()

  if (supabase && userId) {
    try {
      const { data, error } = await supabase
        .from("user_notes")
        .select("*")
        .eq("user_id", userId)
        .contains("tags", [tag])
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data || []).map((note) => ({
        ...note,
        tags: Array.isArray(note.tags) ? note.tags : [],
      })) as Note[]
    } catch (error) {
      console.warn("Supabase getNotesByTag failed, using fallback:", error)
    }
  }

  // Fallback to memory storage
  return memoryNotes
    .filter((note) => {
      const hasTag = note.tags.includes(tag)
      const matchesUser = !userId || note.user_id === userId
      return hasTag && matchesUser
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

// Get all tags for a user
export async function getAllTags(userId?: string): Promise<string[]> {
  const supabase = getSupabaseClient()

  if (supabase && userId) {
    try {
      const { data, error } = await supabase.from("user_notes").select("tags").eq("user_id", userId)

      if (error) throw error

      const allTags = new Set<string>()
      data?.forEach((note) => {
        if (Array.isArray(note.tags)) {
          note.tags.forEach((tag: string) => allTags.add(tag))
        }
      })

      return Array.from(allTags).sort()
    } catch (error) {
      console.warn("Supabase getAllTags failed, using fallback:", error)
    }
  }

  // Fallback to memory storage
  const allTags = new Set<string>()
  memoryNotes
    .filter((note) => !userId || note.user_id === userId)
    .forEach((note) => {
      note.tags.forEach((tag) => allTags.add(tag))
    })

  return Array.from(allTags).sort()
}

// Helper function to get sample notes data
function getSampleNotesData(): Omit<Note, "id" | "user_id">[] {
  return [
    {
      title: "Welcome to News Notes",
      content:
        "This is your first note! You can save articles, add your thoughts, and organize them with tags. Use the AI features to get insights and context about news articles.",
      topic: "Tutorial",
      tags: ["welcome", "tutorial", "getting-started"],
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      is_public: false,
    },
    {
      title: "AI Technology Trends 2024",
      content:
        "Interesting developments in AI technology this year. The integration of machine learning in news analysis is becoming more sophisticated. Key trends include multimodal AI, improved language models, and better fact-checking capabilities.",
      topic: "Technology",
      tags: ["ai", "technology", "trends", "2024"],
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      is_public: false,
    },
    {
      title: "Climate Change Impact Analysis",
      content:
        "Recent studies show accelerating effects of climate change on global weather patterns. Rising sea levels and extreme weather events are becoming more frequent. Important to track policy responses and technological solutions.",
      topic: "Environment",
      tags: ["climate", "environment", "science", "policy"],
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      is_public: false,
    },
    {
      title: "Economic Market Analysis",
      content:
        "Current market trends show volatility in tech stocks while renewable energy sectors are gaining momentum. Federal Reserve policies continue to influence global markets.",
      topic: "Economics",
      tags: ["economics", "markets", "finance", "analysis"],
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      is_public: false,
    },
  ]
}

// Initialize sample notes on module load
function initializeSampleNotes() {
  if (memoryNotes.length === 0) {
    const sampleNotes = getSampleNotesData().map((noteData, index) => ({
      ...noteData,
      id: `sample-${index + 1}`,
      user_id: "anonymous",
    }))

    memoryNotes = sampleNotes
    nextId = sampleNotes.length + 1
    console.log("Initialized with sample notes")
  }
}

// Initialize on module load
initializeSampleNotes()

import { createClient } from "@supabase/supabase-js"

// Fallback client for when Supabase is not available
export interface SupabaseClient {
  from: (table: string) => any
  auth: {
    getUser: () => Promise<{ data: { user: any } | null; error: any }>
    signInWithPassword: (credentials: any) => Promise<{ data: any; error: any }>
    signUp: (credentials: any) => Promise<{ data: any; error: any }>
    signOut: () => Promise<{ error: any }>
  }
}

// Singleton pattern to prevent multiple instances
let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials not found")
      return null
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })

    return supabaseInstance
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error)
    return null
  }
}

// Mock Supabase client for fallback functionality
const mockSupabaseClient: SupabaseClient = {
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
      order: () => Promise.resolve({ data: [], error: null }),
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
    delete: () => ({
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
  }),
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({ data: null, error: { message: "Authentication not available" } }),
    signUp: async () => ({ data: null, error: { message: "Authentication not available" } }),
    signOut: async () => ({ error: null }),
  },
}

export function createSupabaseClient(): SupabaseClient {
  console.log("Using mock Supabase client (fallback mode)")
  return mockSupabaseClient
}

export const supabase = getSupabaseClient() || createSupabaseClient()

// Helper functions for common operations
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      console.warn("Error getting current user:", error)
      return null
    }
    return data.user
  } catch (error) {
    console.error("Error in getCurrentUser:", error)
    return null
  }
}

export async function signInUser(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.warn("Sign in error:", error)
      return { user: null, error }
    }

    return { user: data.user, error: null }
  } catch (error) {
    console.error("Error in signInUser:", error)
    return { user: null, error: { message: "Sign in failed" } }
  }
}

export async function signUpUser(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.warn("Sign up error:", error)
      return { user: null, error }
    }

    return { user: data.user, error: null }
  } catch (error) {
    console.error("Error in signUpUser:", error)
    return { user: null, error: { message: "Sign up failed" } }
  }
}

export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.warn("Sign out error:", error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error("Error in signOutUser:", error)
    return { error: { message: "Sign out failed" } }
  }
}

// Database helper functions
export async function insertRecord(table: string, data: any) {
  try {
    const { data: result, error } = await supabase.from(table).insert(data)

    if (error) {
      console.warn(`Error inserting into ${table}:`, error)
      return { data: null, error }
    }

    return { data: result, error: null }
  } catch (error) {
    console.error(`Error in insertRecord for ${table}:`, error)
    return { data: null, error: { message: "Insert failed" } }
  }
}

export async function selectRecords(table: string, filters?: any) {
  try {
    let query = supabase.from(table).select()

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.warn(`Error selecting from ${table}:`, error)
      return { data: [], error }
    }

    return { data: data || [], error: null }
  } catch (error) {
    console.error(`Error in selectRecords for ${table}:`, error)
    return { data: [], error: { message: "Select failed" } }
  }
}

export async function updateRecord(table: string, id: string, updates: any) {
  try {
    const { data, error } = await supabase.from(table).update(updates).eq("id", id)

    if (error) {
      console.warn(`Error updating ${table}:`, error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error(`Error in updateRecord for ${table}:`, error)
    return { data: null, error: { message: "Update failed" } }
  }
}

export async function deleteRecord(table: string, id: string) {
  try {
    const { data, error } = await supabase.from(table).delete().eq("id", id)

    if (error) {
      console.warn(`Error deleting from ${table}:`, error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error(`Error in deleteRecord for ${table}:`, error)
    return { data: null, error: { message: "Delete failed" } }
  }
}

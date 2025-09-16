import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Helper functions for common operations
export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) {
      console.error("Error getting current user:", error)
      return null
    }
    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Sign in error:", error)
      return { user: null, error }
    }

    return { user: data.user, error: null }
  } catch (error) {
    console.error("Sign in error:", error)
    return { user: null, error }
  }
}

export async function signUpWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error("Sign up error:", error)
      return { user: null, error }
    }

    return { user: data.user, error: null }
  } catch (error) {
    console.error("Sign up error:", error)
    return { user: null, error }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Sign out error:", error)
      return { error }
    }
    return { error: null }
  } catch (error) {
    console.error("Sign out error:", error)
    return { error }
  }
}

export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) {
      console.error("Reset password error:", error)
      return { error }
    }
    return { error: null }
  } catch (error) {
    console.error("Reset password error:", error)
    return { error }
  }
}

// Database helper functions
export async function insertData(table: string, data: any) {
  try {
    const { data: result, error } = await supabase.from(table).insert(data).select()

    if (error) {
      console.error(`Error inserting data into ${table}:`, error)
      return { data: null, error }
    }

    return { data: result, error: null }
  } catch (error) {
    console.error(`Error inserting data into ${table}:`, error)
    return { data: null, error }
  }
}

export async function fetchData(table: string, filters?: any) {
  try {
    let query = supabase.from(table).select("*")

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    const { data, error } = await query

    if (error) {
      console.error(`Error fetching data from ${table}:`, error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error(`Error fetching data from ${table}:`, error)
    return { data: null, error }
  }
}

export async function updateData(table: string, id: string, updates: any) {
  try {
    const { data, error } = await supabase.from(table).update(updates).eq("id", id).select()

    if (error) {
      console.error(`Error updating data in ${table}:`, error)
      return { data: null, error }
    }

    return { data, error: null }
  } catch (error) {
    console.error(`Error updating data in ${table}:`, error)
    return { data: null, error }
  }
}

export async function deleteData(table: string, id: string) {
  try {
    const { error } = await supabase.from(table).delete().eq("id", id)

    if (error) {
      console.error(`Error deleting data from ${table}:`, error)
      return { error }
    }

    return { error: null }
  } catch (error) {
    console.error(`Error deleting data from ${table}:`, error)
    return { error }
  }
}

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function createSupabaseClient() {
  return supabase
}

export { supabase as default }

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
    console.error("Error in getCurrentUser:", error)
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
      console.error("Error signing in:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in signInWithEmail:", error)
    throw error
  }
}

export async function signUpWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error("Error signing up:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in signUpWithEmail:", error)
    throw error
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Error signing out:", error)
      throw error
    }

    return true
  } catch (error) {
    console.error("Error in signOut:", error)
    throw error
  }
}

export async function resetPassword(email: string) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      console.error("Error resetting password:", error)
      throw error
    }

    return data
  } catch (error) {
    console.error("Error in resetPassword:", error)
    throw error
  }
}

export async function insertData(table: string, data: any) {
  try {
    const { data: result, error } = await supabase.from(table).insert(data).select()

    if (error) {
      console.error(`Error inserting data into ${table}:`, error)
      throw error
    }

    return result
  } catch (error) {
    console.error(`Error in insertData for ${table}:`, error)
    throw error
  }
}

export async function selectData(table: string, filters?: any) {
  try {
    let query = supabase.from(table).select("*")

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }

    const { data, error } = await query

    if (error) {
      console.error(`Error selecting data from ${table}:`, error)
      throw error
    }

    return data
  } catch (error) {
    console.error(`Error in selectData for ${table}:`, error)
    throw error
  }
}

export async function updateData(table: string, id: string, updates: any) {
  try {
    const { data, error } = await supabase.from(table).update(updates).eq("id", id).select()

    if (error) {
      console.error(`Error updating data in ${table}:`, error)
      throw error
    }

    return data
  } catch (error) {
    console.error(`Error in updateData for ${table}:`, error)
    throw error
  }
}

export async function deleteData(table: string, id: string) {
  try {
    const { error } = await supabase.from(table).delete().eq("id", id)

    if (error) {
      console.error(`Error deleting data from ${table}:`, error)
      throw error
    }

    return true
  } catch (error) {
    console.error(`Error in deleteData for ${table}:`, error)
    throw error
  }
}

export function subscribeToTable(table: string, callback: (payload: any) => void) {
  try {
    const subscription = supabase
      .channel(`${table}_changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
        },
        callback,
      )
      .subscribe()

    return subscription
  } catch (error) {
    console.error(`Error subscribing to ${table}:`, error)
    return null
  }
}

export function unsubscribe(subscription: any) {
  try {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  } catch (error) {
    console.error("Error unsubscribing:", error)
  }
}

export async function uploadFile(bucket: string, path: string, file: File) {
  try {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file)

    if (error) {
      console.error(`Error uploading file to ${bucket}:`, error)
      throw error
    }

    return data
  } catch (error) {
    console.error(`Error in uploadFile for ${bucket}:`, error)
    throw error
  }
}

export async function downloadFile(bucket: string, path: string) {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path)

    if (error) {
      console.error(`Error downloading file from ${bucket}:`, error)
      throw error
    }

    return data
  } catch (error) {
    console.error(`Error in downloadFile for ${bucket}:`, error)
    throw error
  }
}

export function getPublicUrl(bucket: string, path: string) {
  try {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  } catch (error) {
    console.error(`Error getting public URL for ${bucket}/${path}:`, error)
    return null
  }
}

export function isSupabaseConfigured() {
  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "your-supabase-url" &&
    supabaseAnonKey !== "your-supabase-anon-key"
  )
}

export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("user_notes").select("count").limit(1)

    if (error) {
      console.error("Supabase connection error:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error checking Supabase connection:", error)
    return false
  }
}

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createClient()

// Helper function to get current user
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) {
    console.error("Error getting current user:", error)
    return null
  }
  return user
}

// Helper function to check if user is authenticated
export const isAuthenticated = async () => {
  const user = await getCurrentUser()
  return !!user
}

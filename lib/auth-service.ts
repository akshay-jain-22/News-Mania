import { supabase } from "@/lib/supabase-client"
import type { Provider, AuthError, Session, User } from "@supabase/supabase-js"

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return {
      success: true,
    }
  } catch (error) {
    const authError = error as AuthError
    return {
      success: false,
      error: authError.message,
    }
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    return {
      success: true,
    }
  } catch (error) {
    const authError = error as AuthError
    return {
      success: false,
      error: authError.message,
    }
  }
}

/**
 * Sign in with OTP (one-time password)
 */
export async function signInWithOtp(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
    })

    if (error) {
      throw error
    }

    return {
      success: true,
    }
  } catch (error) {
    const authError = error as AuthError
    return {
      success: false,
      error: authError.message,
    }
  }
}

/**
 * Sign in with a third-party provider
 */
export async function signInWithProvider(provider: Provider): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      throw error
    }

    return {
      success: true,
    }
  } catch (error) {
    const authError = error as AuthError
    return {
      success: false,
      error: authError.message,
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    return {
      success: true,
    }
  } catch (error) {
    const authError = error as AuthError
    return {
      success: false,
      error: authError.message,
    }
  }
}

/**
 * Get the current session
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    return data.session
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser()

    if (error) {
      throw error
    }

    return data.user
  } catch (error) {
    console.error("Error getting user:", error)
    return null
  }
}

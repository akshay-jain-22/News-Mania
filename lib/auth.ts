// Authentication state management with Supabase
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { supabase } from "@/lib/supabase-client"
import type { User } from "@supabase/supabase-js"

type AuthState = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      initialize: async () => {
        try {
          set({ isLoading: true })

          const {
            data: { user },
            error,
          } = await supabase.auth.getUser()

          if (error) {
            console.error("Auth initialization error:", error)
            set({ user: null, isAuthenticated: false, isLoading: false })
            return
          }

          set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
          })

          // Listen for auth changes
          supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth state changed:", event, session?.user?.id)
            set({
              user: session?.user || null,
              isAuthenticated: !!session?.user,
            })
          })
        } catch (error) {
          console.error("Auth initialization failed:", error)
          set({ user: null, isAuthenticated: false, isLoading: false })
        }
      },

      signIn: async (email, password) => {
        try {
          set({ isLoading: true })

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) {
            console.error("Sign in error:", error)
            set({ isLoading: false })
            return false
          }

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          })

          return true
        } catch (error) {
          console.error("Sign in failed:", error)
          set({ isLoading: false })
          return false
        }
      },

      signUp: async (email, password) => {
        try {
          set({ isLoading: true })

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
          })

          if (error) {
            console.error("Sign up error:", error)
            set({ isLoading: false })
            return false
          }

          // Note: User might need to confirm email
          if (data.user && !data.session) {
            console.log("Please check your email for confirmation")
          }

          set({
            user: data.user,
            isAuthenticated: !!data.session,
            isLoading: false,
          })

          return true
        } catch (error) {
          console.error("Sign up failed:", error)
          set({ isLoading: false })
          return false
        }
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut()
          set({ user: null, isAuthenticated: false })
        } catch (error) {
          console.error("Sign out error:", error)
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

// Export useAuthStore as an alias for useAuth for compatibility
export const useAuthStore = useAuth

// Also export as default for flexibility
export default useAuth

// Simple authentication state management without NextAuth
import { create } from "zustand"
import { persist } from "zustand/middleware"

type User = {
  id: string
  name: string
  email: string
  image?: string
}

type AuthState = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      signIn: async (email, password) => {
        set({ isLoading: true })

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500))

        // Simple mock authentication - in a real app, this would call your API
        if (email && password) {
          const user = {
            id: "1",
            name: "Demo User",
            email,
            image: "/placeholder.svg?height=32&width=32",
          }

          set({ user, isAuthenticated: true, isLoading: false })
          return true
        }

        set({ isLoading: false })
        return false
      },
      signOut: () => {
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: "auth-storage",
    },
  ),
)

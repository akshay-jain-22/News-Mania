"use client"

import { useState } from "react"
import { AuthForm } from "@/components/auth-form"
import { supabase } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { ThemeToggle } from "@/components/theme-toggle"

export default function AuthPage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSignIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Sign in successful",
        description: "You have been signed in successfully.",
      })

      router.push("/dashboard")
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message || "An error occurred during sign in.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Sign up successful",
        description: "Please check your email for a confirmation link.",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message || "An error occurred during sign up.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <h1 className="text-xl font-bold">NewsMania</h1>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1 py-12">
        <div className="container grid gap-6 px-4 md:px-6 lg:grid-cols-2 lg:gap-10">
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Welcome to NewsMania</h1>
              <p className="text-muted-foreground">
                Sign in to your account to save articles, create notes, and personalize your news experience.
              </p>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md space-y-6">
            <AuthForm onSignIn={handleSignIn} onSignUp={handleSignUp} loading={loading} />
          </div>
        </div>
      </main>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Brain, Sparkles } from "lucide-react"

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setLoading(false)
    }

    getUser()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between py-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">NewsMania</span>
        </Link>
        <nav className="flex items-center gap-4">
          {/* AI Personalization Button */}
          <Link href="/ai-personalized">
            <Button variant="outline" className="border-purple-500 text-purple-600 hover:bg-purple-50 bg-transparent">
              <Brain className="h-4 w-4 mr-2" />
              <Sparkles className="h-3 w-3 mr-1" />
              AI Feed
            </Button>
          </Link>

          <ThemeToggle />
          {!loading && user ? (
            <>
              <Link href="/notes">
                <Button variant="ghost">My Notes</Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/auth">
              <Button>Sign In</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useI18n } from "@/lib/i18n"

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { t } = useI18n()

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
          <LanguageSwitcher />
          <ThemeToggle />
          {!loading && user ? (
            <>
              <Link href="/notes">
                <Button variant="ghost">{t("nav.myNotes")}</Button>
              </Link>
              <Button variant="outline" onClick={handleSignOut}>
                {t("auth.signOut")}
              </Button>
            </>
          ) : (
            <Link href="/auth">
              <Button>{t("auth.signIn")}</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

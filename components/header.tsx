"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Home, TrendingUp, Shield, Zap, BookOpen, Search, User, Brain, Sparkles, Globe, Settings } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Globe className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">NewsMania</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground/60">
              <Home className="h-4 w-4 inline mr-1" />
              Home
            </Link>
            <Link href="/dashboard" className="transition-colors hover:text-foreground/80 text-foreground/60">
              <TrendingUp className="h-4 w-4 inline mr-1" />
              Dashboard
            </Link>
            <Link
              href="/ai-personalized"
              className="transition-colors hover:text-foreground/80 text-purple-600 font-semibold"
            >
              <Brain className="h-4 w-4 inline mr-1" />
              <Sparkles className="h-3 w-3 inline mr-1" />
              AI Feed
              <Badge variant="secondary" className="ml-1 text-xs bg-purple-100 text-purple-700">
                NEW
              </Badge>
            </Link>
            <Link href="/topics" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Topics
            </Link>
            <Link href="/fact-check" className="transition-colors hover:text-foreground/80 text-foreground/60">
              <Shield className="h-4 w-4 inline mr-1" />
              Fact Check
            </Link>
            <Link href="/extract" className="transition-colors hover:text-foreground/80 text-foreground/60">
              <Zap className="h-4 w-4 inline mr-1" />
              Extract
            </Link>
            <Link href="/notes" className="transition-colors hover:text-foreground/80 text-foreground/60">
              <BookOpen className="h-4 w-4 inline mr-1" />
              Notes
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button variant="outline" size="sm" asChild>
              <Link href="/search">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Link>
            </Button>
          </div>
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth">
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}

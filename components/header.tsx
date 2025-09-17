"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, X, Newspaper, Search, BookOpen, Shield, FileText, Brain, User } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Link href="/" className="flex items-center space-x-2">
            <Newspaper className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">NewsMania</h1>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium hover:text-primary">
            Home
          </Link>
          <Link href="/topics" className="text-sm font-medium hover:text-primary">
            Topics
          </Link>
          <Link href="/search" className="text-sm font-medium hover:text-primary">
            Search
          </Link>
          <Link href="/fact-check" className="text-sm font-medium hover:text-primary">
            Fact Check
          </Link>
          <Link href="/extract" className="text-sm font-medium hover:text-primary">
            Extract
          </Link>
          <Link href="/notes" className="text-sm font-medium hover:text-primary">
            Notes
          </Link>
          <Link
            href="/ai-personalized"
            className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition-colors relative"
          >
            <Brain className="h-4 w-4" />
            <span className="font-semibold">For You</span>
            <Badge className="bg-purple-600 text-white text-xs ml-1">AI</Badge>
          </Link>
          <Link href="/ai-chat" className="text-sm font-medium hover:text-primary">
            AI Chat
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <ThemeToggle />
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#1a1a1a] border-t border-gray-800">
          <nav className="container mx-auto px-4 py-4 space-y-3">
            <Link
              href="/"
              className="flex items-center space-x-2 py-2 hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <Newspaper className="h-4 w-4" />
              <span>Latest News</span>
            </Link>

            <Link
              href="/topics"
              className="flex items-center space-x-2 py-2 hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <BookOpen className="h-4 w-4" />
              <span>Topics</span>
            </Link>

            <Link
              href="/search"
              className="flex items-center space-x-2 py-2 hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <Search className="h-4 w-4" />
              <span>Search</span>
            </Link>

            <Link
              href="/fact-check"
              className="flex items-center space-x-2 py-2 hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <Shield className="h-4 w-4" />
              <span>Fact Check</span>
            </Link>

            <Link
              href="/extract"
              className="flex items-center space-x-2 py-2 hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <FileText className="h-4 w-4" />
              <span>Extract News</span>
            </Link>

            <Link
              href="/notes"
              className="flex items-center space-x-2 py-2 hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <BookOpen className="h-4 w-4" />
              <span>My Notes</span>
            </Link>

            {/* For You - AI Feed Mobile */}
            <Link
              href="/ai-personalized"
              className="flex items-center space-x-2 py-2 text-purple-400 hover:text-purple-300 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <Brain className="h-4 w-4" />
              <span className="font-semibold">For You</span>
              <Badge className="bg-purple-600 text-white text-xs">AI</Badge>
            </Link>

            <Link
              href="/ai-chat"
              className="flex items-center space-x-2 py-2 hover:text-primary transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <span>AI Chat</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}

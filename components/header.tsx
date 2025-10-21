"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/user-nav"
import { Menu, X, Newspaper, Search, BookOpen, Shield, FileText, Brain } from "lucide-react"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="bg-[#121212] border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Newspaper className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">NewsMania</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-1 hover:text-primary transition-colors">
            <Newspaper className="h-4 w-4" />
            <span>Latest</span>
          </Link>

          <Link href="/topics" className="flex items-center space-x-1 hover:text-primary transition-colors">
            <BookOpen className="h-4 w-4" />
            <span>Topics</span>
          </Link>

          <Link href="/search" className="flex items-center space-x-1 hover:text-primary transition-colors">
            <Search className="h-4 w-4" />
            <span>Search</span>
          </Link>

          <Link href="/fact-check" className="flex items-center space-x-1 hover:text-primary transition-colors">
            <Shield className="h-4 w-4" />
            <span>Fact Check</span>
          </Link>

          <Link href="/extract" className="flex items-center space-x-1 hover:text-primary transition-colors">
            <FileText className="h-4 w-4" />
            <span>Extract</span>
          </Link>

          <Link href="/notes" className="flex items-center space-x-1 hover:text-primary transition-colors">
            <BookOpen className="h-4 w-4" />
            <span>Notes</span>
          </Link>

          {/* For You - AI Feed */}
          <Link
            href="/ai-personalized"
            className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition-colors relative"
          >
            <Brain className="h-4 w-4" />
            <span className="font-semibold">For You</span>
            <Badge className="bg-purple-600 text-white text-xs ml-1">AI</Badge>
          </Link>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <UserNav />

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={toggleMenu}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
          </nav>
        </div>
      )}
    </header>
  )
}

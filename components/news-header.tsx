"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Menu, X, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/user-nav"

export function NewsHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsMenuOpen(false)
    }
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top Row - Categories and Right Actions */}
      <div className="border-b border-border/40">
        <div className="container flex h-12 items-center justify-between">
          {/* Left - Topic Categories */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            <Link href="/topics/business" className="text-muted-foreground hover:text-foreground transition-colors">
              BUSINESS
            </Link>
            <Link href="/topics/technology" className="text-muted-foreground hover:text-foreground transition-colors">
              TECH
            </Link>
            <Link href="/topics/health" className="text-muted-foreground hover:text-foreground transition-colors">
              HEALTH
            </Link>
            <Link href="/topics/sports" className="text-muted-foreground hover:text-foreground transition-colors">
              SPORTS
            </Link>
            <Link href="/topics/science" className="text-muted-foreground hover:text-foreground transition-colors">
              SCIENCE
            </Link>
            <Link
              href="/topics/entertainment"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ENTERTAINMENT
            </Link>
          </nav>

          {/* Right - Dashboard and For You */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-sm font-medium">
                DASHBOARD
              </Button>
            </Link>
            <Link href="/ai-personalized">
              <Button
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium"
              >
                <Sparkles className="w-4 h-4 mr-1" />
                FOR YOU
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row - Main Navigation */}
      <div className="container flex h-16 items-center">
        {/* Left - Logo and Navigation */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold">NewsMania</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="text-blue-600 hover:text-blue-700 transition-colors font-medium">
              Latest
            </Link>
            <Link href="/topics" className="text-muted-foreground hover:text-foreground transition-colors">
              Topics
            </Link>
            <Link href="/fact-check" className="text-muted-foreground hover:text-foreground transition-colors">
              Fact Check
            </Link>
            <Link href="/extract" className="text-muted-foreground hover:text-foreground transition-colors">
              Extract News
            </Link>
            <Link href="/notes" className="text-muted-foreground hover:text-foreground transition-colors">
              My Notes
            </Link>
            <Link
              href="/ai-personalized"
              className="text-purple-600 hover:text-purple-700 transition-colors font-medium flex items-center"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              For You
              <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-bold">NEW</span>
            </Link>
          </nav>
        </div>

        {/* Mobile Menu Button */}
        <Button variant="ghost" size="icon" className="md:hidden ml-auto mr-4" onClick={toggleMenu}>
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Toggle Menu</span>
        </Button>

        {/* Right - Search, Theme, Dashboard, Sign In */}
        <div className="hidden md:flex flex-1 items-center justify-end space-x-4">
          <form onSubmit={handleSearch} className="w-full max-w-[300px]">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search articles..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
          <ThemeToggle />
          <Link href="/dashboard">
            <Button size="sm" className="font-medium">
              Dashboard
            </Button>
          </Link>
          <UserNav />
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="container pb-4 md:hidden border-t">
          <div className="flex flex-col space-y-3 pt-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            {/* Navigation Links */}
            <div className="grid grid-cols-2 gap-2">
              <Link href="/" className="text-sm font-medium p-2" onClick={closeMenu}>
                Latest
              </Link>
              <Link href="/topics" className="text-sm font-medium p-2" onClick={closeMenu}>
                Topics
              </Link>
              <Link href="/fact-check" className="text-sm font-medium p-2" onClick={closeMenu}>
                Fact Check
              </Link>
              <Link href="/extract" className="text-sm font-medium p-2" onClick={closeMenu}>
                Extract News
              </Link>
              <Link href="/notes" className="text-sm font-medium p-2" onClick={closeMenu}>
                My Notes
              </Link>
              <Link href="/ai-personalized" className="text-sm font-medium p-2 text-purple-600" onClick={closeMenu}>
                For You (NEW)
              </Link>
            </div>

            {/* Topic Categories */}
            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">CATEGORIES</p>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/topics/business" className="text-sm p-2" onClick={closeMenu}>
                  Business
                </Link>
                <Link href="/topics/technology" className="text-sm p-2" onClick={closeMenu}>
                  Technology
                </Link>
                <Link href="/topics/health" className="text-sm p-2" onClick={closeMenu}>
                  Health
                </Link>
                <Link href="/topics/sports" className="text-sm p-2" onClick={closeMenu}>
                  Sports
                </Link>
                <Link href="/topics/science" className="text-sm p-2" onClick={closeMenu}>
                  Science
                </Link>
                <Link href="/topics/entertainment" className="text-sm p-2" onClick={closeMenu}>
                  Entertainment
                </Link>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2 pt-3 border-t">
              <div className="flex items-center justify-between">
                <ThemeToggle />
                <UserNav />
              </div>
              <Link href="/dashboard" onClick={closeMenu}>
                <Button size="sm" className="w-full">
                  Dashboard
                </Button>
              </Link>
              <Link href="/ai-personalized" onClick={closeMenu}>
                <Button
                  size="sm"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  For You
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

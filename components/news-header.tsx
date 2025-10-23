"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Menu, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

export function NewsHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsMenuOpen(false) // Close mobile menu after search
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
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">NewsMania</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/topics/technology" className="transition-colors hover:text-foreground/80">
              Technology
            </Link>
            <Link href="/topics/politics" className="transition-colors hover:text-foreground/80">
              Politics
            </Link>
            <Link href="/topics/business" className="transition-colors hover:text-foreground/80">
              Business
            </Link>
            <Link href="/topics/health" className="transition-colors hover:text-foreground/80">
              Health
            </Link>
            <Link href="/topics/science" className="transition-colors hover:text-foreground/80">
              Science
            </Link>
            <Link href="/topics/sports" className="transition-colors hover:text-foreground/80">
              Sports
            </Link>
            <Link href="/topics/entertainment" className="transition-colors hover:text-foreground/80">
              Entertainment
            </Link>
          </nav>
        </div>
        <div className="flex items-center justify-between md:hidden">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold">NewsMania</span>
          </Link>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <form onSubmit={handleSearch} className="w-full max-w-[300px] md:max-w-[200px] lg:max-w-[300px]">
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
          <Link href="/notes">
            <Button variant="outline" size="sm" className="hidden md:flex">
              My Notes
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm" className="hidden md:flex">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
      {isMenuOpen && (
        <div className="container pb-3 md:hidden">
          <nav className="flex flex-col space-y-3">
            <Link href="/topics/technology" className="text-sm font-medium" onClick={closeMenu}>
              Technology
            </Link>
            <Link href="/topics/politics" className="text-sm font-medium" onClick={closeMenu}>
              Politics
            </Link>
            <Link href="/topics/business" className="text-sm font-medium" onClick={closeMenu}>
              Business
            </Link>
            <Link href="/topics/health" className="text-sm font-medium" onClick={closeMenu}>
              Health
            </Link>
            <Link href="/topics/science" className="text-sm font-medium" onClick={closeMenu}>
              Science
            </Link>
            <Link href="/topics/sports" className="text-sm font-medium" onClick={closeMenu}>
              Sports
            </Link>
            <Link href="/topics/entertainment" className="text-sm font-medium" onClick={closeMenu}>
              Entertainment
            </Link>
            <div className="flex flex-col space-y-2 pt-2">
              <Link href="/notes" onClick={closeMenu}>
                <Button variant="outline" size="sm" className="w-full">
                  My Notes
                </Button>
              </Link>
              <Link href="/dashboard" onClick={closeMenu}>
                <Button size="sm" className="w-full">
                  Dashboard
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

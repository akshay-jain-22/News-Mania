"use client"

import type React from "react"

import { useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Newspaper, Search, Menu, X, Bell, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserNav } from "@/components/user-nav"
import { refreshAllNews } from "@/lib/news-api"
import { useToast } from "@/components/ui/use-toast"

export function DashboardHeader() {
  const [searchQuery, setSearchQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setMobileMenuOpen(false) // Close mobile menu after search
    }
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleRefresh = async () => {
    if (isRefreshing) return

    setIsRefreshing(true)

    try {
      await refreshAllNews()

      toast({
        title: "News refreshed",
        description: "The latest news has been loaded.",
      })

      // Refresh the current page to show new content
      router.refresh()
    } catch (error) {
      console.error("Error refreshing news:", error)

      toast({
        variant: "destructive",
        title: "Refresh failed",
        description: "There was an error refreshing the news. Please try again.",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <Newspaper className="h-6 w-6" />
            <span className="text-xl font-bold">NewsMania</span>
          </Link>
        </div>

        {/* Main Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium hover:underline underline-offset-4">
            Dashboard
          </Link>
          <Link href="/topics" className="text-sm font-medium hover:underline underline-offset-4">
            Topics
          </Link>
          <Link href="/fact-check" className="text-sm font-medium hover:underline underline-offset-4">
            Fact Check
          </Link>
          <Link href="/notes" className="text-sm font-medium hover:underline underline-offset-4">
            My Notes
          </Link>
          <Link href="/extract" className="text-sm font-medium hover:underline underline-offset-4">
            Extract
          </Link>
        </nav>

        {/* Right Side - Search & Icons */}
        <div className="flex items-center gap-3">
          {/* Search - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search news..."
              className="w-64 pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Action Icons - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing} title="Refresh news">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="sr-only">Refresh News</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-auto">
                  <DropdownMenuItem className="flex flex-col items-start">
                    <div className="font-medium">New fact-check available</div>
                    <div className="text-sm text-muted-foreground">A recent article you read has been fact-checked</div>
                    <div className="text-xs text-muted-foreground mt-1">2 minutes ago</div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start">
                    <div className="font-medium">Topic update: Technology</div>
                    <div className="text-sm text-muted-foreground">5 new articles in your Technology feed</div>
                    <div className="text-xs text-muted-foreground mt-1">1 hour ago</div>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle />
            <UserNav />
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMobileMenu}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-4 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search news..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            {/* Mobile Navigation */}
            <nav className="flex flex-col space-y-2">
              <Link
                href="/dashboard"
                className="px-2 py-1.5 text-sm font-medium hover:bg-accent rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                href="/topics"
                className="px-2 py-1.5 text-sm font-medium hover:bg-accent rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Topics
              </Link>
              <Link
                href="/fact-check"
                className="px-2 py-1.5 text-sm font-medium hover:bg-accent rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Fact Check
              </Link>
              <Link
                href="/notes"
                className="px-2 py-1.5 text-sm font-medium hover:bg-accent rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Notes
              </Link>
              <Link
                href="/extract"
                className="px-2 py-1.5 text-sm font-medium hover:bg-accent rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Extract
              </Link>

              {/* Mobile Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleRefresh()
                    setMobileMenuOpen(false)
                  }}
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <UserNav />
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}

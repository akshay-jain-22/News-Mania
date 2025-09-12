"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/user-nav"
import { Brain, Sparkles, Search, Menu, X } from "lucide-react"
import { useState } from "react"

export function NewsHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const categories = [
    { id: "business", name: "BUSINESS" },
    { id: "technology", name: "TECH" },
    { id: "health", name: "HEALTH" },
    { id: "sports", name: "SPORTS" },
    { id: "science", name: "SCIENCE" },
    { id: "entertainment", name: "ENTERTAINMENT" },
  ]

  return (
    <header className="bg-[#121212] border-b border-gray-800 sticky top-0 z-50">
      {/* Top Row - Categories and Dashboard/For You */}
      <div className="bg-[#1a1a1a] py-2 px-4 hidden md:block">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8 text-xs font-medium">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/topics/${category.id}`}
                className="text-gray-300 hover:text-white transition-colors tracking-wide"
              >
                {category.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-xs font-medium text-gray-300 hover:text-white" asChild>
              <Link href="/dashboard">DASHBOARD</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-medium bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
              asChild
            >
              <Link href="/ai-personalized" className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                FOR YOU
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Row - Main Navigation */}
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Left Side - Logo and Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-white">NewsMania</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-blue-400 font-medium text-sm hover:text-blue-300 transition-colors">
              Latest
            </Link>
            <Link href="/topics" className="text-gray-300 hover:text-white transition-colors text-sm">
              Topics
            </Link>
            <Link href="/fact-check" className="text-gray-300 hover:text-white transition-colors text-sm">
              Fact Check
            </Link>
            <Link href="/extract" className="text-gray-300 hover:text-white transition-colors text-sm">
              Extract News
            </Link>
            <Link href="/notes" className="text-gray-300 hover:text-white transition-colors text-sm">
              My Notes
            </Link>
            <Link
              href="/ai-personalized"
              className="text-purple-400 hover:text-purple-300 transition-colors font-medium flex items-center gap-1 text-sm"
            >
              <Brain className="h-4 w-4" />
              <Sparkles className="h-3 w-3" />
              For You
              <Badge variant="secondary" className="ml-1 text-xs bg-purple-600 text-white">
                NEW
              </Badge>
            </Link>
          </nav>
        </div>

        {/* Right Side - Search, Theme, Dashboard, Sign In */}
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="search"
              placeholder="Search articles..."
              className="pl-10 pr-4 py-2 w-64 bg-[#2a2a2a] border-gray-700 text-white placeholder-gray-400 focus:border-purple-500"
            />
          </div>

          <ThemeToggle />

          <Button variant="outline" size="sm" asChild className="hidden md:flex bg-transparent">
            <Link href="/dashboard">Dashboard</Link>
          </Button>

          <UserNav />

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1a1a1a] border-t border-gray-800">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search articles..."
                className="pl-10 pr-4 py-2 w-full bg-[#2a2a2a] border-gray-700 text-white placeholder-gray-400"
              />
            </div>

            {/* Mobile Navigation Links */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/"
                className="text-blue-400 font-medium p-2 rounded hover:bg-gray-800 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Latest
              </Link>
              <Link
                href="/topics"
                className="text-gray-300 p-2 rounded hover:bg-gray-800 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Topics
              </Link>
              <Link
                href="/fact-check"
                className="text-gray-300 p-2 rounded hover:bg-gray-800 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Fact Check
              </Link>
              <Link
                href="/extract"
                className="text-gray-300 p-2 rounded hover:bg-gray-800 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Extract News
              </Link>
              <Link
                href="/notes"
                className="text-gray-300 p-2 rounded hover:bg-gray-800 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Notes
              </Link>
              <Link
                href="/ai-personalized"
                className="text-purple-400 p-2 rounded hover:bg-gray-800 transition-colors flex items-center gap-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Brain className="h-4 w-4" />
                For You
                <Badge variant="secondary" className="ml-1 text-xs bg-purple-600 text-white">
                  NEW
                </Badge>
              </Link>
            </div>

            {/* Mobile Categories */}
            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Categories</h3>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/topics/${category.id}`}
                    className="text-gray-300 p-2 rounded hover:bg-gray-800 transition-colors text-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="border-t border-gray-700 pt-4 space-y-2">
              <Button asChild className="w-full" onClick={() => setMobileMenuOpen(false)}>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button
                asChild
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link href="/ai-personalized">
                  <Brain className="h-4 w-4 mr-2" />
                  For You - AI Feed
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

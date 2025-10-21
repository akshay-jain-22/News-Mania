"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Newspaper, Search } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Newspaper className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">NewsMania</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link href="/topics" className="transition-colors hover:text-foreground/80">
              Topics
            </Link>
            <Link href="/search" className="transition-colors hover:text-foreground/80">
              Search
            </Link>
          </nav>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <div className="hidden sm:flex">
            <Button variant="ghost" size="sm">
              <Search className="h-4 w-4" />
              <span className="ml-2">Search</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

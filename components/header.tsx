"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-2xl">
            📰 NewsMania
          </Link>
          <nav className="hidden md:flex gap-4">
            <Link href="/" className="text-sm hover:text-primary">
              Home
            </Link>
            <Link href="/search" className="text-sm hover:text-primary">
              Search
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search news..." className="pl-8 w-64" />
          </div>
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </div>
      </div>
    </header>
  )
}

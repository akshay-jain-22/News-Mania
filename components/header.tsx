"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Header() {
  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">N</span>
          </div>
          <span className="text-xl font-bold">NewsMania</span>
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link href="/" className="text-sm font-medium hover:text-primary">
            Home
          </Link>
          <Link href="/topics" className="text-sm font-medium hover:text-primary">
            Topics
          </Link>
          <Link href="/search" className="text-sm font-medium hover:text-primary">
            Search
          </Link>
        </nav>
        <Button variant="default" size="sm">
          Subscribe
        </Button>
      </div>
    </header>
  )
}

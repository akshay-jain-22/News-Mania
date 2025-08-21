"use client"

import { MLPersonalizedFeed } from "@/components/ml-personalized-feed"

export default function AIPersonalizedPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Main Navigation */}
      <header className="bg-[#121212] border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold">NewsMania</span>
            </a>
            <div className="hidden md:flex items-center space-x-6">
              <a href="/" className="hover:text-primary transition-colors">
                Latest
              </a>
              <a href="/topics" className="hover:text-primary transition-colors">
                Topics
              </a>
              <a href="/fact-check" className="hover:text-primary transition-colors">
                Fact Check
              </a>
              <a href="/extract" className="hover:text-primary transition-colors">
                Extract News
              </a>
              <a href="/notes" className="hover:text-primary transition-colors">
                My Notes
              </a>
              <span className="text-purple-400 font-semibold">AI Feed</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="px-3 py-1.5 text-sm border border-gray-600 rounded-md hover:bg-gray-800 transition-colors"
            >
              Dashboard
            </a>
            <a
              href="/auth"
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Sign In
            </a>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <MLPersonalizedFeed userId="demo-user" />
      </main>
    </div>
  )
}

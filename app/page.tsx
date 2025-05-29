"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { SplashScreen } from "@/components/splash-screen"
import { BookOpen, BrainCircuit, ChevronRight, ExternalLink, Globe, LayoutDashboard, Shield, Rss } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence } from "framer-motion"

// Array of newspaper images for the front page
const newspaperImages = [
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1920&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1920&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1566378246598-5b11a0d486cc?w=1920&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=1920&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1504465039542-a4bfabebbc98?w=1920&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?w=1920&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1920&h=1080&fit=crop",
]

// Array of hero section images
const heroImages = [
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1280&h=720&fit=crop",
  "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1280&h=720&fit=crop",
  "https://images.unsplash.com/photo-1566378246598-5b11a0d486cc?w=1280&h=720&fit=crop",
  "https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?w=1280&h=720&fit=crop",
  "https://images.unsplash.com/photo-1504465039542-a4bfabebbc98?w=1280&h=720&fit=crop",
]

export default function Home() {
  const [showSplash, setShowSplash] = useState(true)
  const [randomNewspaperImage, setRandomNewspaperImage] = useState("")
  const [randomHeroImage, setRandomHeroImage] = useState("")

  useEffect(() => {
    // Set random images after component mounts to avoid hydration mismatch
    setRandomNewspaperImage(newspaperImages[Math.floor(Math.random() * newspaperImages.length)])
    setRandomHeroImage(heroImages[Math.floor(Math.random() * heroImages.length)])
  }, [])

  const handleSplashComplete = () => {
    setShowSplash(false)
  }

  return (
    <>
      <AnimatePresence>{showSplash && <SplashScreen onComplete={handleSplashComplete} />}</AnimatePresence>

      <div className="flex min-h-screen flex-col">
        {/* Navigation */}
        <Header />

        <main className="flex-1">
          {/* Hero Section */}
          <section id="home" className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-background to-muted">
            <div className="container px-4 md:px-6">
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">NewsMania</h1>
                    <p className="text-xl text-muted-foreground">News Aggregation with AI-Powered Rumor Detection</p>
                  </div>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Stay informed with verified news from multiple sources, personalized to your interests.
                  </p>
                  <div className="flex flex-col gap-2 min-[400px]:flex-row">
                    <Button size="lg" asChild>
                      <Link href="/dashboard">
                        Try Dashboard
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <Link href="/topics">Browse Topics</Link>
                    </Button>
                  </div>
                </div>
                <div className="mx-auto lg:mx-0 relative aspect-video overflow-hidden rounded-xl border bg-background">
                  <Image
                    src={randomHeroImage || "/placeholder.svg"}
                    alt="NewsMania Dashboard Preview"
                    width={1280}
                    height={720}
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-background/90 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
                      <h3 className="font-bold text-lg">Breaking News</h3>
                      <p className="text-sm text-muted-foreground">
                        Stay updated with the latest headlines from around the world
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Newspaper Image Section */}
          <section className="w-full py-12 md:py-24 bg-background">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Your Daily News Source
                  </h2>
                  <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                    Comprehensive coverage from trusted sources, all in one place
                  </p>
                </div>
                <div className="relative w-full max-w-4xl mx-auto mt-8 rounded-xl overflow-hidden shadow-2xl">
                  <Image
                    src={randomNewspaperImage || "/placeholder.svg"}
                    alt="Newspaper"
                    width={1920}
                    height={1080}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
                        <h3 className="font-bold">Breaking News</h3>
                        <p className="text-sm text-muted-foreground">Latest updates from around the world</p>
                      </div>
                      <div className="bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
                        <h3 className="font-bold">Fact Checked</h3>
                        <p className="text-sm text-muted-foreground">Verified information you can trust</p>
                      </div>
                      <div className="bg-background/80 backdrop-blur-sm p-4 rounded-lg border">
                        <h3 className="font-bold">Personalized</h3>
                        <p className="text-sm text-muted-foreground">News tailored to your interests</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Features</h2>
                  <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                    Discover the powerful tools and capabilities that make NewsMania your ultimate news companion.
                  </p>
                </div>
                <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
                  <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Rss className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Multi-Source Aggregation</h3>
                    <p className="text-muted-foreground text-center">
                      News from various platforms consolidated in one place, categorized by topics.
                    </p>
                  </div>
                  <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Rumor Detection</h3>
                    <p className="text-muted-foreground text-center">
                      AI-powered fact-checking to identify potentially misleading or fake news.
                    </p>
                  </div>
                  <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <BookOpen className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Personal Notes</h3>
                    <p className="text-muted-foreground text-center">
                      Add notes to articles and topics, synced across all your devices.
                    </p>
                  </div>
                  <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <LayoutDashboard className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Personalized Feed</h3>
                    <p className="text-muted-foreground text-center">
                      Customize your news experience with topics and sources that matter to you.
                    </p>
                  </div>
                  <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <BrainCircuit className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Smart Recommendations</h3>
                    <p className="text-muted-foreground text-center">
                      AI-powered content suggestions based on your reading habits and preferences.
                    </p>
                  </div>
                  <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <Globe className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold">Multilingual Support</h3>
                    <p className="text-muted-foreground text-center">
                      Access news in multiple languages with automatic translation features.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Notes Section */}
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Your Personal Notes App
                  </h1>
                  <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    Create, organize, and manage your notes with our simple and intuitive interface.
                  </p>
                </div>
                <div className="space-x-4">
                  <Link href="/auth">
                    <Button>Get Started</Button>
                  </Link>
                  <Link href="/notes">
                    <Button variant="outline">View Notes</Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="w-full border-t py-6 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} NewsMania. All rights reserved.
              </p>
              <div className="flex items-center gap-4">
                <Link href="#" className="text-sm text-muted-foreground hover:underline underline-offset-4">
                  Privacy Policy
                </Link>
                <Link href="#" className="text-sm text-muted-foreground hover:underline underline-offset-4">
                  Terms of Service
                </Link>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href="#">
                      <ExternalLink className="h-4 w-4" />
                      <span className="sr-only">GitHub</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </>
  )
}

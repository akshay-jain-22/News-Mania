import type React from "react"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import "./globals.css"

export const metadata: Metadata = {
  title: "NewsCore - Your Daily News Hub",
  description: "Stay informed with NewsCore - Real-time news, trending stories, and in-depth analysis.",
  keywords: "news, trending, current events, world news, technology, business",
  openGraph: {
    title: "NewsCore - Your Daily News Hub",
    description: "Stay informed with the latest news and trends",
    type: "website",
  },
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          <main className="min-h-screen bg-background">{children}</main>
          <footer className="border-t border-border bg-muted">
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
                <div>
                  <h3 className="font-bold text-lg mb-2">NewsCore</h3>
                  <p className="text-sm text-muted-foreground">Your trusted source for real-time news and updates.</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Quick Links</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      <a href="/" className="hover:text-foreground transition-colors">
                        Home
                      </a>
                    </li>
                    <li>
                      <a href="/trending" className="hover:text-foreground transition-colors">
                        Trending
                      </a>
                    </li>
                    <li>
                      <a href="/categories" className="hover:text-foreground transition-colors">
                        Categories
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Information</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      <a href="#" className="hover:text-foreground transition-colors">
                        About Us
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-foreground transition-colors">
                        Contact
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-foreground transition-colors">
                        Privacy Policy
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 border-t border-border pt-8">
                <p className="text-center text-sm text-muted-foreground">
                  © {new Date().getFullYear()} NewsCore. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}

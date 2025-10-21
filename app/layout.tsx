import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Header } from "@/components/header"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NewsMania - Latest News & Stories",
  description: "Stay updated with the latest news from around the world",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen bg-background">{children}</main>
      </body>
    </html>
  )
}

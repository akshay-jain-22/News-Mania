import type { ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/header"
import "@/app/globals.css"

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          <main className="container mx-auto py-8">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.app'
    };

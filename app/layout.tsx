import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
//import { SplashScreen } from "@/components/splash-screen"
import { AuthProvider } from "@/components/auth-provider"
import { VoiceAssistantTrigger } from "@/components/voice-assistant/voice-assistant-trigger"
import { I18nProvider } from "@/lib/i18n"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NewsMania - Your Trusted News Source",
  description:
    "Stay informed with the latest news, fact-checked articles, and in-depth analysis from around the world.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <I18nProvider>
            <AuthProvider>
              {children}
              <Toaster />
              <VoiceAssistantTrigger />
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

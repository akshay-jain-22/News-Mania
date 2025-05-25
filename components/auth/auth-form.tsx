"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Mail, Github, Chrome } from "lucide-react"
import { signInWithEmail, signUpWithEmail, signInWithOtp, signInWithProvider } from "@/lib/auth-service"
import { useRouter } from "next/navigation"

export function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [activeTab, setActiveTab] = useState("signin")
  const { toast } = useToast()
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signInWithEmail(email, password)

      if (result.success) {
        toast({
          title: "Sign in successful",
          description: "Welcome back to NewsMania!",
        })
        router.push("/dashboard")
      } else {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: result.error || "Please check your credentials and try again.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signUpWithEmail(email, password)

      if (result.success) {
        toast({
          title: "Sign up successful",
          description: "Please check your email to confirm your account.",
        })
        setActiveTab("signin")
      } else {
        toast({
          variant: "destructive",
          title: "Sign up failed",
          description: result.error || "Please try again with a different email.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signInWithOtp(email)

      if (result.success) {
        setIsOtpSent(true)
        toast({
          title: "Magic link sent",
          description: "Please check your email for a magic link to sign in.",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Failed to send magic link",
          description: result.error || "Please check your email and try again.",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to send magic link",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleProviderSignIn = async (provider: "github" | "google") => {
    setIsLoading(true)

    try {
      const result = await signInWithProvider(provider)

      if (!result.success) {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: result.error || `Failed to sign in with ${provider}.`,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
          <TabsTrigger value="magic">Magic Link</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <form onSubmit={handleSignIn}>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>Enter your email and password to access your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleProviderSignIn("github")}
                  disabled={isLoading}
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleProviderSignIn("google")}
                  disabled={isLoading}
                >
                  <Chrome className="mr-2 h-4 w-4" />
                  Google
                </Button>
              </div>
            </CardFooter>
          </form>
        </TabsContent>

        <TabsContent value="signup">
          <form onSubmit={handleSignUp}>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Create a new account to start using NewsMania.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing up...
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>

        <TabsContent value="magic">
          <form onSubmit={handleOtpRequest}>
            <CardHeader>
              <CardTitle>Magic Link</CardTitle>
              <CardDescription>
                {isOtpSent
                  ? "Check your email for a magic link to sign in."
                  : "We'll email you a magic link for passwordless sign in."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="magic-email">Email</Label>
                <Input
                  id="magic-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading || isOtpSent}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : isOtpSent ? (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Magic Link Sent
                  </>
                ) : (
                  "Send Magic Link"
                )}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  )
}

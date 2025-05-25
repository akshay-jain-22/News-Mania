"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [errorDescription, setErrorDescription] = useState<string>("")

  useEffect(() => {
    const errorParam = searchParams.get("error")
    setError(errorParam)

    // Set a user-friendly error description based on the error code
    switch (errorParam) {
      case "Configuration":
        setErrorDescription("There is a problem with the server configuration. Please contact support.")
        break
      case "AccessDenied":
        setErrorDescription("You do not have permission to sign in.")
        break
      case "Verification":
        setErrorDescription("The verification link may have been used or is invalid.")
        break
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
      case "EmailCreateAccount":
      case "Callback":
      case "OAuthAccountNotLinked":
      case "EmailSignin":
      case "CredentialsSignin":
        setErrorDescription("There was a problem with authentication. Please try again.")
        break
      default:
        setErrorDescription("An unexpected error occurred. Please try again later.")
    }
  }, [searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4 text-destructive">
            <AlertCircle size={48} />
          </div>
          <CardTitle className="text-2xl text-center">Authentication Error</CardTitle>
          <CardDescription className="text-center">
            {error && <span className="font-medium">{error}</span>}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">{errorDescription}</p>
          <p className="text-sm text-muted-foreground">If this problem persists, please contact support.</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link href="/auth/login">Return to Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

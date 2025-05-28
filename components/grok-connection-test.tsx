"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertTriangle, Wifi } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface ConnectionStatus {
  status: "connected" | "disconnected" | "error"
  message: string
  timestamp: string
}

export function GrokConnectionTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const { toast } = useToast()

  const testConnection = async () => {
    setIsLoading(true)
    setConnectionStatus(null)

    try {
      console.log("🧪 Testing Grok AI connection...")

      const response = await fetch("/api/fact-check", {
        method: "GET",
      })

      const result = await response.json()
      setConnectionStatus(result)

      if (result.status === "connected") {
        toast({
          title: "✅ Connection Successful",
          description: "Grok AI is working properly",
        })
      } else {
        toast({
          variant: "destructive",
          title: "❌ Connection Failed",
          description: result.message,
        })
      }
    } catch (error) {
      const errorResult = {
        status: "error" as const,
        message: `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date().toISOString(),
      }

      setConnectionStatus(errorResult)

      toast({
        variant: "destructive",
        title: "❌ Test Failed",
        description: errorResult.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = () => {
    if (!connectionStatus) return <Wifi className="h-4 w-4" />

    switch (connectionStatus.status) {
      case "connected":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "disconnected":
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Wifi className="h-4 w-4" />
    }
  }

  const getStatusBadge = () => {
    if (!connectionStatus) return null

    switch (connectionStatus.status) {
      case "connected":
        return (
          <Badge variant="default" className="bg-green-600">
            Connected
          </Badge>
        )
      case "disconnected":
        return <Badge variant="destructive">Disconnected</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Grok AI Connection Test
        </CardTitle>
        <CardDescription>Test the connection to Grok AI for fact-checking functionality</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testConnection} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            "Test Connection"
          )}
        </Button>

        {connectionStatus && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              {getStatusBadge()}
            </div>

            <div className="text-sm text-muted-foreground">
              <strong>Message:</strong> {connectionStatus.message}
            </div>

            <div className="text-xs text-muted-foreground">
              <strong>Tested at:</strong> {new Date(connectionStatus.timestamp).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

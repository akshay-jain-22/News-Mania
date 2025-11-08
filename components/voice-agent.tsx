"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, X, Volume2, VolumeX, Loader2, Bot, User, Minimize2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: number
  intent?: string
}

interface VoiceAgentProps {
  onClose?: () => void
}

export function VoiceAgent({ onClose }: VoiceAgentProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [transcript, setTranscript] = useState("")
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const router = useRouter()
  const retryCountRef = useRef(0)
  const maxRetries = 3

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "en-US"

        recognitionRef.current.onresult = (event: any) => {
          retryCountRef.current = 0

          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result) => result.transcript)
            .join("")

          setTranscript(transcript)

          if (event.results[0].isFinal) {
            handleUserMessage(transcript)
            setTranscript("")
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error("[Voice Agent] Recognition error:", event.error)
          setIsListening(false)

          if (event.error === "network") {
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++
              toast({
                title: "Connection issue",
                description: `Retrying... (${retryCountRef.current}/${maxRetries})`,
              })

              setTimeout(() => {
                if (recognitionRef.current && retryCountRef.current <= maxRetries) {
                  try {
                    recognitionRef.current.start()
                    setIsListening(true)
                  } catch (e) {
                    console.error("[Voice Agent] Retry failed:", e)
                  }
                }
              }, 1000)
            } else {
              retryCountRef.current = 0
              toast({
                variant: "destructive",
                title: "Voice connection failed",
                description: "Please check your internet connection and try again, or type your message instead.",
              })
            }
          } else if (event.error === "no-speech") {
            toast({
              title: "No speech detected",
              description: "Please try speaking again.",
            })
          } else if (event.error === "aborted") {
            return
          } else if (event.error === "audio-capture") {
            toast({
              variant: "destructive",
              title: "Microphone error",
              description: "Please check your microphone permissions.",
            })
          } else if (event.error === "not-allowed") {
            toast({
              variant: "destructive",
              title: "Microphone access denied",
              description: "Please allow microphone access in your browser settings.",
            })
          } else {
            toast({
              variant: "destructive",
              title: "Voice recognition error",
              description: "An unexpected error occurred. Please try again.",
            })
          }
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      } else {
        toast({
          variant: "destructive",
          title: "Voice not supported",
          description: "Your browser doesn't support voice recognition.",
        })
      }

      synthRef.current = window.speechSynthesis
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
    }
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      role: "assistant",
      content: "Hi! I'm your Newsurf voice assistant. Click the microphone to start talking, or ask me anything!",
      timestamp: Date.now(),
      intent: "greeting",
    }
    setMessages([welcomeMessage])

    if (!isMuted && synthRef.current) {
      speak(welcomeMessage.content)
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        variant: "destructive",
        title: "Voice not available",
        description: "Voice recognition is not supported in your browser.",
      })
      return
    }

    if (isListening) {
      retryCountRef.current = 0
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      retryCountRef.current = 0
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (error) {
        console.error("[Voice Agent] Start error:", error)
        toast({
          variant: "destructive",
          title: "Microphone error",
          description: "Please allow microphone access to use voice features.",
        })
      }
    }
  }

  const speak = useCallback(
    (text: string) => {
      if (isMuted || !synthRef.current) return

      synthRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0
      utterance.lang = "en-US"

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      synthRef.current.speak(utterance)
    },
    [isMuted],
  )

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  const handleUserMessage = async (message: string) => {
    if (!message.trim()) return

    const userMessage: Message = {
      role: "user",
      content: message,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsProcessing(true)

    try {
      const response = await fetch("/api/voice-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationHistory: messages,
        }),
      })

      const data = await response.json()

      const assistantMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: data.timestamp,
        intent: data.intent,
      }

      setMessages((prev) => [...prev, assistantMessage])

      if (!isMuted) {
        speak(data.response)
      }

      if (data.actionData?.action === "navigate") {
        setTimeout(() => {
          router.push(data.actionData.target)
        }, 2000)
      }

      if (data.actionData?.action === "search") {
        setTimeout(() => {
          router.push(`/search?q=${encodeURIComponent(data.actionData.query)}`)
        }, 2000)
      }
    } catch (error) {
      console.error("[Voice Agent] Error:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your request. Please try again.",
        timestamp: Date.now(),
        intent: "error",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsProcessing(false)
    }
  }

  const getIntentBadge = (intent?: string) => {
    if (!intent) return null

    const intentColors: Record<string, string> = {
      search: "bg-blue-600",
      navigate: "bg-green-600",
      summarize: "bg-purple-600",
      fact_check: "bg-yellow-600",
      greeting: "bg-gray-600",
      help: "bg-indigo-600",
    }

    return <Badge className={`${intentColors[intent] || "bg-gray-600"} text-white text-xs ml-2`}>{intent}</Badge>
  }

  if (isMinimized) {
    return (
      <Card className="fixed bottom-4 right-4 w-16 h-16 shadow-2xl border-2 border-primary z-50">
        <Button variant="ghost" size="icon" className="w-full h-full" onClick={() => setIsMinimized(false)}>
          <Bot className="h-6 w-6 text-primary animate-pulse" />
        </Button>
      </Card>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] shadow-2xl border-2 border-primary z-50 flex flex-col">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Newsurf Voice Assistant</CardTitle>
            {isListening && <Badge className="bg-red-600 animate-pulse">Listening</Badge>}
            {isSpeaking && <Badge className="bg-blue-600 animate-pulse">Speaking</Badge>}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsMinimized(true)}>
              <Minimize2 className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`flex items-start gap-2 max-w-[85%] ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div className={`p-2 rounded-full ${message.role === "user" ? "bg-primary" : "bg-muted"}`}>
                  {message.role === "user" ? (
                    <User className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.intent && getIntentBadge(message.intent)}
                </div>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-muted p-3 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          )}

          {transcript && (
            <div className="flex justify-end">
              <div className="bg-primary/20 p-3 rounded-lg max-w-[85%]">
                <p className="text-sm italic">{transcript}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <CardContent className="border-t pt-4 pb-4">
        <div className="flex items-center gap-2">
          <Button
            size="lg"
            className={`flex-1 ${isListening ? "bg-red-600 hover:bg-red-700" : ""}`}
            onClick={toggleListening}
            disabled={isProcessing}
          >
            {isListening ? (
              <>
                <MicOff className="h-5 w-5 mr-2 animate-pulse" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 mr-2" />
                Start Talking
              </>
            )}
          </Button>

          {isSpeaking && (
            <Button size="lg" variant="outline" onClick={stopSpeaking}>
              <VolumeX className="h-5 w-5" />
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          {isListening ? "Listening... Speak now" : "Click the microphone to start voice conversation"}
        </p>
      </CardContent>
    </Card>
  )
}

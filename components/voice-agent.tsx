"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Mic, MicOff, X, Volume2, VolumeX, Loader2, Bot, User, Minimize2, Send, AlertCircle } from "lucide-react"
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

type AgentMode = "voice" | "manualText" | "recovering"

export function VoiceAgent({ onClose }: VoiceAgentProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [transcript, setTranscript] = useState("")
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [textInput, setTextInput] = useState("")

  const [mode, setMode] = useState<AgentMode>("voice")
  const [recognitionRetries, setRecognitionRetries] = useState(0)
  const [isRecovering, setIsRecovering] = useState(false)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recoveryTimerRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = false
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = "en-US"

        recognitionRef.current.onresult = (event: any) => {
          setRecognitionRetries(0)
          setIsRecovering(false)

          if (mode !== "voice") {
            setMode("voice")
          }

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
          console.log("[Voice Agent] Recognition error:", event.error)
          setIsListening(false)

          if (event.error === "network" || event.error === "no-speech") {
            if (recognitionRetries < 1) {
              // First retry after 1.5 seconds
              setRecognitionRetries((prev) => prev + 1)
              speak("I'm having trouble hearing you. Please say that again.")

              retryTimeoutRef.current = setTimeout(() => {
                if (recognitionRef.current && mode === "voice") {
                  try {
                    recognitionRef.current.start()
                    setIsListening(true)
                  } catch (e) {
                    console.log("[Voice Agent] Retry failed:", e)
                  }
                }
              }, 1500)
              return
            } else {
              setMode("manualText")
              speak("I'm still having trouble with voice. Let's try typing instead.")
              setRecognitionRetries(0)
              return
            }
          }

          // Handle other errors
          if (event.error === "not-allowed") {
            speak("I need microphone permission to work. Please allow access or use text mode.")
            setMode("manualText")
          } else if (event.error === "audio-capture") {
            speak("Cannot access your microphone. Switching to text mode.")
            setMode("manualText")
          } else if (event.error === "aborted") {
            // Silently handle aborts
          }
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)

          if (mode === "recovering") {
            // Retry every 10 seconds
            recoveryTimerRef.current = setTimeout(() => {
              attemptVoiceRecovery()
            }, 10000)
          }
        }
      } else {
        // Browser doesn't support speech recognition
        setMode("manualText")
        speak("Voice recognition is not supported in this browser. Using text mode.")
      }

      synthRef.current = window.speechSynthesis
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {}
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
      if (recoveryTimerRef.current) {
        clearTimeout(recoveryTimerRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [mode, recognitionRetries])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const welcomeMessage: Message = {
      role: "assistant",
      content:
        "Hi! I'm your Newsurf voice assistant. You can talk to me or type your questions. How can I help you today?",
      timestamp: Date.now(),
      intent: "greeting",
    }
    setMessages([welcomeMessage])

    if (!isMuted) {
      speak(welcomeMessage.content)
    }
  }, [])

  const attemptVoiceRecovery = useCallback(() => {
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.start()
      setIsListening(true)
      setIsRecovering(false)
      setMode("voice")
      console.log("[Voice Agent] Recovery attempt successful")
    } catch (error) {
      console.log("[Voice Agent] Recovery attempt failed, will retry")
      setIsRecovering(true)
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      speak("Voice recognition is not available. Please use text mode.")
      setMode("manualText")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      setRecognitionRetries(0)
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    } else {
      try {
        recognitionRef.current.start()
        setIsListening(true)
        if (mode === "recovering") {
          setMode("voice")
          setIsRecovering(false)
        }
      } catch (error) {
        console.log("[Voice Agent] Start error:", error)
        speak("Having trouble starting voice. Let's use text mode for now.")
        setMode("manualText")
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

      // Execute actions
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

      if (mode === "manualText" && recognitionRef.current) {
        setTimeout(() => {
          setMode("voice")
          speak("I'm back in voice mode. You can talk to me now.")
        }, 3000)
      }
    } catch (error) {
      console.error("[Voice Agent] Error:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
        intent: "error",
      }
      setMessages((prev) => [...prev, errorMessage])
      speak(errorMessage.content)
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

  const handleTextSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!textInput.trim() || isProcessing) return

    handleUserMessage(textInput)
    setTextInput("")
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
            {mode === "recovering" && (
              <Badge variant="outline" className="text-yellow-600">
                Recovering...
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsMinimized(true)} title="Minimize">
              <Minimize2 className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} title="Close">
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
        {mode === "recovering" ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  Voice connection lost. Reconnecting soon...
                </p>
              </div>
            </div>

            <form onSubmit={handleTextSubmit} className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type your message while I reconnect..."
                  disabled={isProcessing}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={isProcessing || !textInput.trim()}>
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </form>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs bg-transparent"
              onClick={attemptVoiceRecovery}
            >
              <Mic className="h-3 w-3 mr-1" />
              Try voice now
            </Button>
          </div>
        ) : mode === "manualText" ? (
          <form onSubmit={handleTextSubmit} className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isProcessing}
                className="flex-1"
                autoFocus
              />
              <Button type="submit" size="icon" disabled={isProcessing || !textInput.trim()}>
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            {recognitionRef.current && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs bg-transparent"
                onClick={() => {
                  setMode("voice")
                  setRecognitionRetries(0)
                }}
              >
                <Mic className="h-3 w-3 mr-1" />
                Switch back to voice
              </Button>
            )}

            <p className="text-xs text-muted-foreground text-center">I'll still speak my responses aloud</p>
          </form>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                size="lg"
                className={`flex-1 ${isListening ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-primary"}`}
                onClick={toggleListening}
                disabled={isProcessing}
              >
                {isListening ? (
                  <>
                    <MicOff className="h-5 w-5 mr-2" />
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

            <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
              <Input
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Or type here..."
                disabled={isProcessing}
                className="flex-1 h-9 text-sm"
              />
              <Button type="submit" size="sm" disabled={isProcessing || !textInput.trim()}>
                <Send className="h-3 w-3" />
              </Button>
            </form>

            <p className="text-xs text-muted-foreground text-center">
              {isListening ? "🎤 Listening... Speak now" : "Click microphone to talk or type below"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

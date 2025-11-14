"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Mic, MicOff, Volume2, VolumeX, Minimize2, Send, Bot, User, Loader2, Radio, Phone, MessageSquare } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from 'next/navigation'

type AssistantMode = "push_to_talk" | "continuous" | "assistant_initiated"
type ConversationState = "idle" | "recording" | "processing" | "speaking"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: number
}

interface VoiceAssistantProps {
  onClose?: () => void
  contextType?: string
  contextId?: string
}

export function VoiceAssistant({ onClose, contextType, contextId }: VoiceAssistantProps) {
  const [mode, setMode] = useState<AssistantMode>("push_to_talk")
  const [state, setState] = useState<ConversationState>("idle")
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId] = useState<string>(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [anonId] = useState<string>(() => `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
  const [micPermissionDenied, setMicPermissionDenied] = useState(false)
  
  // Speech recognition
  const recognitionRef = useRef<any>(null)
  const silenceTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Audio recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioStreamRef = useRef<MediaStream | null>(null)
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Welcome message based on mode
    const welcomeMessage = getWelcomeMessage(mode)
    addMessage("assistant", welcomeMessage)
    
    if (!isMuted) {
      setTimeout(() => speak(welcomeMessage), 500)
    }
  }, [])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === "undefined") return

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.log("[Voice Assistant] Web Speech API not available")
      setMicPermissionDenied(true)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = mode === "continuous"
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onstart = () => {
      console.log("[v0] Speech recognition started")
      setState("recording")
    }

    recognition.onresult = (event: any) => {
      let interim = ""
      let final = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }

      if (final) {
        console.log("[v0] Final transcript:", final)
        handleUserSpeech(final)
      }
    }

    recognition.onerror = (event: any) => {
      console.log("[v0] Speech recognition error:", event.error)
      
      if (event.error === "aborted") return
      
      if (event.error === "network") {
        setMicPermissionDenied(true)
        return
      }
      
      if (event.error === "not-allowed") {
        setMicPermissionDenied(true)
        toast({
          title: "Microphone Access Required",
          description: "Please allow microphone access to use voice features.",
          variant: "destructive",
        })
      }
    }

    recognition.onend = () => {
      console.log("[v0] Speech recognition ended")
      setState("idle")
    }

    recognitionRef.current = recognition

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [mode])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Mode change handler
  const handleModeChange = (newMode: AssistantMode) => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    
    setMode(newMode)
    setState("idle")
    
    // Assistant-initiated: speak a prompt
    if (newMode === "assistant_initiated") {
      const prompt = "Hi! Would you like a summary of today's top stories, or should I help you find something specific?"
      addMessage("assistant", prompt)
      if (!isMuted) {
        speak(prompt)
      }
    }
    
    // Continuous: start listening
    if (newMode === "continuous" && !micPermissionDenied && recognitionRef.current) {
      setTimeout(() => recognitionRef.current.start(), 500)
    }
  }

  // Start listening
  const startListening = () => {
    if (!recognitionRef.current || micPermissionDenied) {
      return
    }
    
    try {
      recognitionRef.current.start()
    } catch (error) {
      console.log("[v0] Recognition start error:", error)
    }
  }

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setState("idle")
  }

  // Handle user speech
  const handleUserSpeech = async (transcript: string) => {
    if (!transcript.trim()) return
    
    stopListening()
    
    addMessage("user", transcript)
    setState("processing")
    
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: transcript,
          sessionId,
          anonId,
          contextType,
          contextId,
          conversationHistory: messages.slice(-4),
        }),
      })
      
      const data = await response.json()
      
      addMessage("assistant", data.response)
      
      // Speak response
      if (!isMuted) {
        speak(data.response)
      } else {
        setState("idle")
      }
      
      // Handle actions
      if (data.actionData) {
        handleAction(data.actionData)
      }
    } catch (error) {
      console.error("[Voice Assistant] Error:", error)
      const errorMsg = "I'm sorry, I encountered an error. Please try again."
      addMessage("assistant", errorMsg)
      
      if (!isMuted) {
        speak(errorMsg)
      } else {
        setState("idle")
      }
    }
  }

  // Process audio
  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) {
      setState("idle")
      return
    }

    setState("processing")

    try {
      // Convert audio to base64
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
      const reader = new FileReader()
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(",")[1]
        
        console.log("[v0] Sending audio to STT...")
        
        // Call STT API
        const sttResponse = await fetch("/api/stt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ audioBase64: base64Audio }),
        })

        if (!sttResponse.ok) {
          throw new Error("STT failed")
        }

        const { text } = await sttResponse.json()
        console.log("[v0] STT result:", text)

        if (!text || !text.trim()) {
          toast({
            title: "Could not understand audio",
            description: "Please try speaking again.",
            variant: "destructive",
          })
          setState("idle")
          return
        }

        // Add user message
        addMessage("user", text)

        // Get AI response
        await getAIResponse(text)
      }

      reader.readAsDataURL(audioBlob)
    } catch (error) {
      console.error("[v0] Audio processing error:", error)
      toast({
        title: "Error",
        description: "Could not process audio. Please try again.",
        variant: "destructive",
      })
      setState("idle")
    }
  }

  // Get AI response
  const getAIResponse = async (userMessage: string) => {
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          sessionId,
          contextType,
          contextId,
          conversationHistory: messages.slice(-4),
        }),
      })

      const data = await response.json()
      
      addMessage("assistant", data.response)

      // Speak response
      if (!isMuted) {
        speak(data.response)
      } else {
        setState("idle")
      }

      // Handle actions
      if (data.actionData) {
        handleAction(data.actionData)
      }
    } catch (error) {
      console.error("[v0] AI response error:", error)
      const errorMsg = "I'm sorry, I encountered an error. Please try again."
      addMessage("assistant", errorMsg)
      
      if (!isMuted) {
        speak(errorMsg)
      } else {
        setState("idle")
      }
    }
  }

  // Speak text using browser TTS
  const speak = (text: string) => {
    if (isMuted || typeof window === "undefined") {
      setState("idle")
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    // Small delay to ensure previous speech is fully cancelled
    setTimeout(() => {
      setState("speaking")

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      utterance.rate = 1.0
      utterance.pitch = 1.0

      // Select a natural voice
      const voices = window.speechSynthesis.getVoices()
      const preferredVoice = voices.find(v => v.lang.startsWith("en-") && (v.name.includes("Google") || v.name.includes("Natural")))
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onend = () => {
        setState("idle")
      }

      utterance.onerror = (event) => {
        // Only log actual errors, not interruptions
        if (event.error !== "interrupted" && event.error !== "canceled") {
          console.error("[v0] Speech synthesis error:", event.error)
        }
        setState("idle")
      }

      window.speechSynthesis.speak(utterance)
    }, 100)
  }

  // Add message
  const addMessage = (role: "user" | "assistant", content: string) => {
    const message: Message = {
      role,
      content,
      timestamp: Date.now(),
    }
    setMessages((prev) => [...prev, message])
  }

  // Handle actions
  const handleAction = (actionData: any) => {
    if (actionData.action === "navigate") {
      setTimeout(() => {
        router.push(actionData.target)
      }, 2000)
    } else if (actionData.action === "search") {
      setTimeout(() => {
        router.push(`/search?q=${encodeURIComponent(actionData.query)}`)
      }, 2000)
    }
  }

  const getWelcomeMessage = (mode: AssistantMode): string => {
    switch (mode) {
      case "push_to_talk":
        return "Hello! I'm your Newsurf voice assistant. Press and hold the microphone button to speak with me about news, search for articles, or navigate the site."
      case "continuous":
        return "Hi! I'm listening continuously. Just start speaking and I'll help you with news, searches, or navigation."
      case "assistant_initiated":
        return "Hi! Would you like a summary of today's top stories, or should I help you find something specific?"
      default:
        return "Hello! How can I help you today?"
    }
  }

  // UI Rendering
  if (isMinimized) {
    return (
      <Card className="fixed bottom-4 right-4 w-16 h-16 shadow-2xl border-2 border-primary z-50">
        <Button
          variant="ghost"
          size="icon"
          className="w-full h-full"
          onClick={() => setIsMinimized(false)}
        >
          <Bot className="h-6 w-6 text-primary animate-pulse" />
        </Button>
      </Card>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-[420px] h-[650px] shadow-2xl border-2 border-primary z-50 flex flex-col">
      <CardHeader className="border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Voice Assistant</CardTitle>
            {state !== "idle" && (
              <Badge className={`${
                state === "recording" ? "bg-red-600 animate-pulse" :
                state === "processing" ? "bg-yellow-600" :
                "bg-blue-600 animate-pulse"
              }`}>
                {state}
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(true)}
              title="Minimize"
            >
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
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex items-start gap-2 max-w-[85%] ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`p-2 rounded-full ${
                    message.role === "user" ? "bg-primary" : "bg-muted"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </div>
          ))}

          {state === "processing" && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-muted p-3 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing your message...</span>
              </div>
            </div>
          )}

          {state === "speaking" && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <Volume2 className="h-4 w-4 animate-pulse text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-600 dark:text-blue-400">Assistant is speaking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <CardContent className="border-t pt-4 pb-4">
        <div className="space-y-2">
          {micPermissionDenied ? (
            <div className="text-center p-4 bg-destructive/10 rounded-lg">
              <p className="text-sm text-destructive font-medium mb-2">Microphone Access Denied</p>
              <p className="text-xs text-muted-foreground">
                Please allow microphone access in your browser settings to use voice features.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center">
                <Button
                  variant={state === "recording" ? "destructive" : "default"}
                  size="lg"
                  className="w-32 h-32 rounded-full"
                  onMouseDown={startListening}
                  onMouseUp={stopListening}
                  onTouchStart={startListening}
                  onTouchEnd={stopListening}
                  disabled={state === "processing" || state === "speaking"}
                >
                  {state === "recording" ? (
                    <div className="flex flex-col items-center gap-2">
                      <Mic className="h-12 w-12 animate-pulse" />
                      <span className="text-xs">Listening...</span>
                    </div>
                  ) : state === "processing" ? (
                    <Loader2 className="h-12 w-12 animate-spin" />
                  ) : (
                    <Mic className="h-12 w-12" />
                  )}
                </Button>
              </div>

              {state === "recording" && (
                <div className="flex items-center justify-center gap-1">
                  <div className="w-1 h-8 bg-red-600 animate-pulse rounded" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-1 h-12 bg-red-600 animate-pulse rounded" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-1 h-10 bg-red-600 animate-pulse rounded" style={{ animationDelay: "300ms" }}></div>
                  <div className="w-1 h-14 bg-red-600 animate-pulse rounded" style={{ animationDelay: "450ms" }}></div>
                  <div className="w-1 h-8 bg-red-600 animate-pulse rounded" style={{ animationDelay: "600ms" }}></div>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                {state === "idle" && "Press and hold the microphone to speak"}
                {state === "recording" && "Release to send your message"}
                {state === "processing" && "Converting speech to text..."}
                {state === "speaking" && "Assistant is responding..."}
              </p>

              {state === "speaking" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.speechSynthesis.cancel()
                    }
                    setState("idle")
                  }}
                >
                  <VolumeX className="h-4 w-4 mr-2" />
                  Stop Speaking
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

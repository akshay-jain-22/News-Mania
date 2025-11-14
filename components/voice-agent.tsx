"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { X, Volume2, VolumeX, Loader2, Bot, User, Minimize2, Send, Mic, MicOff } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from 'next/navigation'

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
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [isListening, setIsListening] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    const welcomeMessage: Message = {
      role: "assistant",
      content:
        "Hi! I'm your Newsurf assistant. Ask me anything or click the mic to speak with me!",
      timestamp: Date.now(),
      intent: "greeting",
    }
    setMessages([welcomeMessage])

    if (!isMuted) {
      speak(welcomeMessage.content)
    }
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (isMuted || typeof window === "undefined") return

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = "en-US"
      utterance.rate = 1.0
      utterance.pitch = 1.0
      
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      speechSynthesisRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [isMuted]
  )

  const stopSpeaking = () => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      audioChunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setIsListening(true)
    } catch (error) {
      console.error('[Voice Agent] Microphone access error:', error)
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      })
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    setIsListening(false)
    setIsProcessing(true)
    
    try {
      const reader = new FileReader()
      reader.readAsDataURL(audioBlob)
      
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1]
        
        const response = await fetch('/api/google-stt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioContent: base64Audio })
        })
        
        const data = await response.json()
        
        if (data.transcript) {
          await handleUserMessage(data.transcript)
        } else {
          toast({
            title: "No speech detected",
            description: "Please try speaking again.",
            variant: "default",
          })
          setIsProcessing(false)
        }
      }
    } catch (error) {
      console.error('[Voice Agent] Audio processing error:', error)
      toast({
        title: "Voice recognition failed",
        description: "Please try again or use text input.",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const toggleListening = () => {
    if (isListening) {
      mediaRecorderRef.current?.stop()
      setIsListening(false)
    } else {
      startRecording()
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
        await speak(data.response)
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
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
        intent: "error",
      }
      setMessages((prev) => [...prev, errorMessage])
      if (!isMuted) {
        await speak(errorMessage.content)
      }
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
            <CardTitle className="text-base">Newsurf Assistant</CardTitle>
            {isSpeaking && <Badge className="bg-blue-600 animate-pulse">Speaking</Badge>}
            {isListening && <Badge className="bg-red-600 animate-pulse">Listening</Badge>}
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
                <span className="text-sm">Processing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <CardContent className="border-t pt-4 pb-4">
        <div className="space-y-2">
          <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant={isListening ? "destructive" : "outline"}
              onClick={toggleListening}
              disabled={isProcessing}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
            </Button>
            
            <Input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={isListening ? "Listening..." : "Type or speak your message..."}
              disabled={isProcessing || isListening}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" size="icon" disabled={isProcessing || !textInput.trim() || isListening}>
              <Send className="h-4 w-4" />
            </Button>
          </form>

          {isSpeaking && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={stopSpeaking}
            >
              <VolumeX className="h-4 w-4 mr-2" />
              Stop Speaking
            </Button>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Click the mic to speak or type your message. I'll speak my responses back to you.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic } from "lucide-react"
import { VoiceAgent } from "./voice-agent"

export function VoiceAgentTrigger() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {!isOpen && (
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-40 animate-pulse"
          onClick={() => setIsOpen(true)}
        >
          <Mic className="h-6 w-6" />
          <span className="sr-only">Open Voice Assistant</span>
        </Button>
      )}

      {isOpen && <VoiceAgent onClose={() => setIsOpen(false)} />}
    </>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Mic } from 'lucide-react'
import { VoiceAssistant } from "./voice-assistant"

export function VoiceAssistantTrigger() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-2xl z-40"
          size="icon"
        >
          <Mic className="h-6 w-6 animate-pulse" />
        </Button>
      )}

      {isOpen && <VoiceAssistant onClose={() => setIsOpen(false)} />}
    </>
  )
}

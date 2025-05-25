"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { insertSampleNotes } from "@/lib/notes-service"
import { Loader2 } from "lucide-react"

interface SampleNotesButtonProps {
  onNotesAdded?: () => void
}

export function SampleNotesButton({ onNotesAdded }: SampleNotesButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleAddSampleNotes = async () => {
    setLoading(true)

    try {
      const success = await insertSampleNotes()

      if (!success) {
        throw new Error("Failed to add sample notes")
      }

      toast({
        title: "Sample notes added",
        description: "Sample notes have been added to your account.",
      })

      if (onNotesAdded) {
        onNotesAdded()
      }
    } catch (error) {
      console.error("Error adding sample notes:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add sample notes. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleAddSampleNotes} disabled={loading} variant="outline">
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adding...
        </>
      ) : (
        "Add Sample Notes"
      )}
    </Button>
  )
}

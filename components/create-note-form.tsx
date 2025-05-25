"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createNote } from "@/lib/notes-service"
import { useToast } from "@/components/ui/use-toast"
import type { Note } from "@/types/notes"

interface CreateNoteFormProps {
  onNoteCreated: (note: Note) => void
}

export function CreateNoteForm({ onNoteCreated }: CreateNoteFormProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [topic, setTopic] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide both a title and content for your note.",
      })
      return
    }

    try {
      setIsSubmitting(true)
      console.log("Creating note with data:", {
        title,
        content,
        topic: topic || "General",
      })

      const note = await createNote({
        title,
        content,
        topic: topic || "General",
      })

      if (note) {
        console.log("Note created successfully:", note)
        onNoteCreated(note)
        setTitle("")
        setContent("")
        setTopic("")
      } else {
        throw new Error("Failed to create note")
      }
    } catch (error) {
      console.error("Error creating note:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create note. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" placeholder="Note title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          placeholder="Write your note content..."
          className="min-h-[100px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="topic">Topic (optional)</Label>
        <Input
          id="topic"
          placeholder="e.g., Technology, Politics, Health"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Note"}
      </Button>
    </form>
  )
}

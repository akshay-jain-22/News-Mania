"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createNote } from "@/lib/notes-service"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import type { Note } from "@/types/notes"
import { supabase } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"

interface CreateNoteFormProps {
  onNoteCreated: (note: Note) => void
  articleId?: string
  articleTitle?: string
  articleUrl?: string
}

export function CreateNoteForm({ onNoteCreated, articleId, articleTitle, articleUrl }: CreateNoteFormProps) {
  const [title, setTitle] = useState(articleTitle ? `Note about: ${articleTitle}` : "")
  const [content, setContent] = useState("")
  const [topic, setTopic] = useState("General")
  const [isMarkdown, setIsMarkdown] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

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

      // Check authentication first
      const { data: userData, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error("Auth error:", authError)
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "Please log in again to create notes.",
        })
        router.push("/auth/login")
        return
      }

      if (!userData.user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to create notes.",
        })
        router.push("/auth/login")
        return
      }

      console.log("Creating note with data:", {
        title,
        content: content.substring(0, 50) + "...",
        topic,
        isMarkdown,
        articleId,
        articleTitle,
        articleUrl,
        userId: userData.user.id,
      })

      const note = await createNote({
        title,
        content,
        topic,
        isMarkdown,
        articleId,
        articleTitle,
        articleUrl,
      })

      if (note) {
        console.log("Note created successfully:", note)
        onNoteCreated(note)
        setTitle(articleTitle ? `Note about: ${articleTitle}` : "")
        setContent("")
        setTopic("General")
        setIsMarkdown(false)

        toast({
          title: "Success!",
          description: "Your note has been created successfully.",
        })
      } else {
        throw new Error("Failed to create note - no data returned")
      }
    } catch (err) {
      console.error("Error creating note:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(errorMessage)

      toast({
        variant: "destructive",
        title: "Error creating note",
        description: `Failed to create note: ${errorMessage}. Please try again.`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Note title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          placeholder="Write your note content..."
          className="min-h-[150px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="topic">Topic (optional)</Label>
        <Input
          id="topic"
          placeholder="e.g., Technology, Politics, Health, Weather"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="markdown" checked={isMarkdown} onCheckedChange={setIsMarkdown} disabled={isSubmitting} />
        <Label htmlFor="markdown">Enable Markdown Support</Label>
      </div>

      {error && <div className="text-sm text-red-500 p-2 bg-red-50 border border-red-200 rounded">Error: {error}</div>}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Note"
        )}
      </Button>
    </form>
  )
}

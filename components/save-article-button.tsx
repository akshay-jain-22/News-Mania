"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { BookmarkPlus, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createNote } from "@/lib/notes-service"
import { supabase } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"

interface SaveArticleButtonProps {
  articleId: string
  articleTitle: string
  articleUrl?: string
  className?: string
}

export function SaveArticleButton({ articleId, articleTitle, articleUrl, className }: SaveArticleButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [noteContent, setNoteContent] = useState("")
  const [noteTitle, setNoteTitle] = useState(`Notes on: ${articleTitle}`)
  const [topic, setTopic] = useState("News")
  const [isMarkdown, setIsMarkdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSave = async () => {
    if (!noteContent.trim()) {
      toast({
        variant: "destructive",
        title: "Note content required",
        description: "Please enter some content for your note.",
      })
      return
    }

    try {
      setIsLoading(true)

      // Check authentication
      const { data: userData, error: authError } = await supabase.auth.getUser()

      if (authError || !userData.user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to save notes.",
        })
        router.push("/auth/login")
        return
      }

      console.log("Saving article note:", {
        title: noteTitle,
        content: noteContent,
        topic,
        articleId,
        articleTitle,
        articleUrl,
        isMarkdown,
      })

      const savedNote = await createNote({
        title: noteTitle,
        content: noteContent,
        topic,
        articleId,
        articleTitle,
        articleUrl,
        isMarkdown,
      })

      if (savedNote) {
        console.log("Note saved successfully:", savedNote.id)
        toast({
          title: "Note saved",
          description: "Your note has been saved successfully.",
        })

        // Reset form and close dialog
        setNoteContent("")
        setNoteTitle(`Notes on: ${articleTitle}`)
        setTopic("News")
        setIsMarkdown(false)
        setIsOpen(false)
      } else {
        throw new Error("Failed to save note")
      }
    } catch (error) {
      console.error("Error saving note:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      toast({
        variant: "destructive",
        title: "Failed to save note",
        description: `Error: ${errorMessage}. Please try again.`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <BookmarkPlus className="h-4 w-4 mr-2" />
          Save Article with Note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save Article with Personal Note</DialogTitle>
          <DialogDescription>Add your thoughts and notes about this article.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note-title">Note Title</Label>
            <Input
              id="note-title"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Enter note title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="note-content">Your Notes</Label>
            <Textarea
              id="note-content"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Write your thoughts about this article..."
              className="min-h-[120px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., News, Technology"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="markdown" checked={isMarkdown} onCheckedChange={setIsMarkdown} />
            <Label htmlFor="markdown">Enable Markdown formatting</Label>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading || !noteContent.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Note"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

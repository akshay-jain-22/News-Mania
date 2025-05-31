"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BookmarkPlus, Bookmark } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { createNote } from "@/lib/notes-service"
import { useAuthStore } from "@/lib/auth"

interface SaveArticleButtonProps {
  articleId: string
  articleTitle: string
  articleUrl?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function SaveArticleButton({
  articleId,
  articleTitle,
  articleUrl,
  variant = "ghost",
  size = "icon",
  className = "",
}: SaveArticleButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const { toast } = useToast()
  const { user } = useAuthStore()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please sign in to save articles.",
      })
      return
    }

    if (!noteText.trim()) {
      toast({
        variant: "destructive",
        title: "Note required",
        description: "Please add a note before saving.",
      })
      return
    }

    setIsSaving(true)

    try {
      await createNote({
        title: `Note: ${articleTitle}`,
        content: noteText,
        topic: "Saved Articles",
        article_id: articleId,
        article_title: articleTitle,
        article_url: articleUrl,
      })

      setIsSaved(true)
      setIsOpen(false)
      setNoteText("")

      toast({
        title: "Article saved!",
        description: "Your note has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving note:", error)
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "There was an error saving your note. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setIsOpen(true)}
        title="Save article with note"
      >
        {isSaved ? <Bookmark className="h-4 w-4 fill-current" /> : <BookmarkPlus className="h-4 w-4" />}
        {size !== "icon" && <span className="ml-2">{isSaved ? "Saved" : "Save Article with Note"}</span>}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Article with Note</DialogTitle>
            <DialogDescription>Add a personal note to save with "{articleTitle}"</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="note">Your Note</Label>
                <Textarea
                  id="note"
                  placeholder="Add your thoughts about this article..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Note"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

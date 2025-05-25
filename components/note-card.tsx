"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { deleteNote, updateNote } from "@/lib/notes-service"
import { useToast } from "@/components/ui/use-toast"
import { Pencil, Trash2, Save, X, ExternalLink } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import type { Note } from "@/types/notes"

interface NoteCardProps {
  note: Note
  onDelete: (id: string) => void
  onUpdate: (id: string, updatedNote: Partial<Note>) => void
}

export function NoteCard({ note, onDelete, onUpdate }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [topic, setTopic] = useState(note.topic)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      console.log("Deleting note:", note.id)
      const success = await deleteNote(note.id)

      if (success) {
        console.log("Note deleted successfully")
        onDelete(note.id)
        toast({
          title: "Note deleted",
          description: "Your note has been deleted successfully.",
        })
      } else {
        throw new Error("Failed to delete note")
      }
    } catch (error) {
      console.error("Error deleting note:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete note. Please try again.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide both a title and content for your note.",
      })
      return
    }

    try {
      setIsSaving(true)
      console.log("Updating note:", note.id, { title, content, topic })
      const updatedNote = await updateNote(note.id, { title, content, topic })

      if (updatedNote) {
        console.log("Note updated successfully:", updatedNote)
        onUpdate(note.id, updatedNote)
        setIsEditing(false)
        toast({
          title: "Note updated",
          description: "Your note has been updated successfully.",
        })
      } else {
        throw new Error("Failed to update note")
      }
    } catch (error) {
      console.error("Error updating note:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update note. Please try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setTitle(note.title)
    setContent(note.content)
    setTopic(note.topic)
    setIsEditing(false)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        {isEditing ? (
          <div className="space-y-2">
            <Label htmlFor={`title-${note.id}`}>Title</Label>
            <Input
              id={`title-${note.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
            />
          </div>
        ) : (
          <CardTitle className="text-xl">{note.title}</CardTitle>
        )}
        {!isEditing && note.topic && (
          <Badge variant="outline" className="w-fit">
            {note.topic}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-grow pb-2">
        {isEditing ? (
          <div className="space-y-2">
            <Label htmlFor={`content-${note.id}`}>Content</Label>
            <Textarea
              id={`content-${note.id}`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Note content"
              className="min-h-[100px]"
            />
            <Label htmlFor={`topic-${note.id}`}>Topic</Label>
            <Input
              id={`topic-${note.id}`}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Technology, Politics, Health"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-muted-foreground whitespace-pre-wrap">{note.content}</p>
            {note.articleId && note.articleTitle && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">
                  From article:{" "}
                  <Link
                    href={`/article/${note.articleId}`}
                    className="text-primary hover:underline inline-flex items-center"
                  >
                    {note.articleTitle} <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t">
        <div className="text-xs text-muted-foreground">
          {formatDate(note.updatedAt !== note.createdAt ? note.updatedAt : note.createdAt)}
          {note.updatedAt !== note.createdAt && " (edited)"}
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Note</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this note? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

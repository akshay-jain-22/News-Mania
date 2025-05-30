"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { saveNote, getNotes } from "@/lib/notes-service"
import { formatDistanceToNow } from "date-fns"
import { Loader2, BookMarkedIcon as Markdown } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import ReactMarkdown from "react-markdown"
import type { Note } from "@/types/notes"

interface NotesSectionProps {
  articleId: string
  articleTitle?: string
  articleUrl?: string
}

export function NotesSection({ articleId, articleTitle, articleUrl }: NotesSectionProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState("")
  const [isMarkdown, setIsMarkdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getUser()

      if (error) {
        console.error("Auth error:", error)
        setIsAuthenticated(false)
        return
      }

      setIsAuthenticated(!!data.user)

      if (!data.user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to add notes.",
        })
      }
    }

    checkAuth()
  }, [toast])

  // Load existing notes for this article
  const loadNotes = async () => {
    try {
      setInitialLoading(true)
      setError(null)

      const { data: userData, error: authError } = await supabase.auth.getUser()

      if (authError || !userData.user) {
        console.error("Auth error or no user:", authError)
        setNotes([])
        return
      }

      const articleNotes = await getNotes(articleId)
      console.log(`Loaded ${articleNotes.length} notes for article ${articleId}`)
      setNotes(articleNotes)
    } catch (error) {
      console.error("Failed to load notes:", error)
      setError("Failed to load notes. Please try again.")
      toast({
        variant: "destructive",
        title: "Error loading notes",
        description: "We couldn't load your notes. Please try again later.",
      })
    } finally {
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    if (articleId && isAuthenticated) {
      loadNotes()
    }
  }, [articleId, isAuthenticated])

  const handleSaveNote = async () => {
    if (!newNote.trim()) return
    setError(null)

    try {
      // Check if user is authenticated
      const { data, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error("Auth error:", authError)
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "Please log in again to add notes.",
        })
        router.push("/auth/login")
        return
      }

      if (!data.user) {
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to add notes.",
        })
        router.push("/auth/login")
        return
      }

      setLoading(true)

      console.log(`Saving note for article ${articleId}:`, newNote.substring(0, 50) + "...")
      const savedNote = await saveNote(articleId, newNote, articleTitle, isMarkdown, articleUrl)

      if (!savedNote) {
        throw new Error("Failed to save note - no data returned")
      }

      // Update the UI
      setNotes([savedNote, ...notes])
      setNewNote("")

      toast({
        title: "Note saved",
        description: "Your note has been saved successfully.",
      })
    } catch (error) {
      console.error("Failed to save note:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setError(errorMessage)

      toast({
        variant: "destructive",
        title: "Failed to save note",
        description: `Error: ${errorMessage}. Please try again.`,
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Your Notes</h2>
        <Card className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Please log in to add and view notes for this article.</p>
          <Button onClick={() => router.push("/auth/login")}>Log In</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Notes</h2>
      <p className="text-muted-foreground">Add personal notes and thoughts about this article</p>

      <div className="grid gap-4">
        <Textarea
          placeholder="Add your notes here..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="min-h-[120px]"
          disabled={loading}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch id="markdown-toggle" checked={isMarkdown} onCheckedChange={setIsMarkdown} disabled={loading} />
            <Label htmlFor="markdown-toggle" className="flex items-center">
              <Markdown className="h-4 w-4 mr-1" />
              Markdown
            </Label>
          </div>
          <Button onClick={handleSaveNote} disabled={loading || !newNote.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Note"
            )}
          </Button>
        </div>

        {error && <div className="text-sm text-red-500 p-2 bg-red-50 border border-red-200 rounded">{error}</div>}
      </div>

      <Separator className="my-6" />

      <div className="space-y-4">
        {initialLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notes.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No notes yet. Add your first note above.</p>
        ) : (
          notes.map((note) => (
            <Card key={note.id}>
              <CardHeader className="p-4 pb-2">
                <CardDescription className="flex justify-between">
                  <span>{formatDistanceToNow(new Date(note.createdAt))} ago</span>
                  {note.isMarkdown && (
                    <Badge variant="outline" className="text-xs">
                      <Markdown className="h-3 w-3 mr-1" />
                      Markdown
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {note.isMarkdown ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{note.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{note.content}</p>
                )}

                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

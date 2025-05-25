"use client"

import { useState, useEffect } from "react"
import { NewsHeader } from "@/components/news-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getUserNotes, insertSampleNotes } from "@/lib/notes-service"
import { NoteCard } from "@/components/note-card"
import { CreateNoteForm } from "@/components/create-note-form"
import { PlusCircle, Search, FolderOpen, Loader2, BookOpen } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import type { Note } from "@/types/notes"

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Check authentication and fetch notes
  useEffect(() => {
    checkAuthAndFetchNotes()
  }, [])

  const checkAuthAndFetchNotes = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        console.error("Auth error:", error)
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "Please try logging in again.",
        })
        router.push("/auth")
        return
      }

      if (!user) {
        console.log("No authenticated user found")
        toast({
          variant: "destructive",
          title: "Authentication required",
          description: "Please log in to view your notes.",
        })
        router.push("/auth")
        return
      }

      console.log("User authenticated:", user.id)
      setIsAuthenticated(true)
      await fetchNotes()
    } catch (error) {
      console.error("Error checking auth:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchNotes = async () => {
    try {
      console.log("Fetching notes...")
      const fetchedNotes = await getUserNotes()
      console.log("Fetched notes:", fetchedNotes.length)
      setNotes(fetchedNotes)
      setFilteredNotes(fetchedNotes)
    } catch (error) {
      console.error("Error fetching notes:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load notes. Please try again.",
      })
    }
  }

  // Filter notes when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredNotes(notes)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.topic.toLowerCase().includes(query) ||
        note.tags.some((tag) => tag.toLowerCase().includes(query)),
    )

    setFilteredNotes(filtered)
  }, [searchQuery, notes])

  // Group notes by topic
  const notesByTopic: Record<string, Note[]> = {}
  filteredNotes.forEach((note) => {
    if (!notesByTopic[note.topic]) {
      notesByTopic[note.topic] = []
    }
    notesByTopic[note.topic].push(note)
  })

  const topics = Object.keys(notesByTopic)

  const handleNoteCreated = (note: Note) => {
    setNotes([note, ...notes])
    setDialogOpen(false)
    toast({
      title: "Note created",
      description: "Your note has been created successfully.",
    })
  }

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter((note) => note.id !== id))
    toast({
      title: "Note deleted",
      description: "Your note has been deleted successfully.",
    })
  }

  const handleUpdateNote = (id: string, updatedNote: Partial<Note>) => {
    setNotes(notes.map((note) => (note.id === id ? { ...note, ...updatedNote } : note)))
    toast({
      title: "Note updated",
      description: "Your note has been updated successfully.",
    })
  }

  const handleAddSampleNotes = async () => {
    try {
      const success = await insertSampleNotes()
      if (success) {
        await fetchNotes()
        toast({
          title: "Sample notes added",
          description: "Sample notes have been added to your collection.",
        })
      } else {
        throw new Error("Failed to add sample notes")
      }
    } catch (error) {
      console.error("Error adding sample notes:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add sample notes. Please try again.",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <NewsHeader />
        <main className="flex-1 py-6">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center h-[50vh]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Loading notes...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col">
        <NewsHeader />
        <main className="flex-1 py-6">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center h-[50vh] text-center">
              <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h1 className="text-3xl font-bold tracking-tight">Authentication Required</h1>
              <p className="text-muted-foreground mt-2 mb-4">Please log in to view and manage your notes.</p>
              <Button onClick={() => router.push("/auth")}>Go to Login</Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NewsHeader />

      <main className="flex-1 py-6">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">My Notes</h1>
                <p className="text-muted-foreground">Manage your personal notes ({notes.length} total)</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search notes..."
                    className="w-full pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      New Note
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Create New Note</DialogTitle>
                      <DialogDescription>Add a new note to your collection.</DialogDescription>
                    </DialogHeader>
                    <CreateNoteForm onNoteCreated={handleNoteCreated} />
                  </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={fetchNotes}>
                  Refresh
                </Button>
              </div>
            </div>

            {filteredNotes.length > 0 ? (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="flex flex-wrap h-auto">
                  <TabsTrigger value="all">All Notes ({filteredNotes.length})</TabsTrigger>
                  {topics.map((topic) => (
                    <TabsTrigger key={topic} value={topic}>
                      {topic} ({notesByTopic[topic].length})
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="all" className="mt-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredNotes.map((note) => (
                      <NoteCard key={note.id} note={note} onDelete={handleDeleteNote} onUpdate={handleUpdateNote} />
                    ))}
                  </div>
                </TabsContent>

                {topics.map((topic) => (
                  <TabsContent key={topic} value={topic} className="mt-6">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {notesByTopic[topic].map((note) => (
                        <NoteCard key={note.id} note={note} onDelete={handleDeleteNote} onUpdate={handleUpdateNote} />
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <Card className="flex flex-col items-center justify-center p-6 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">{searchQuery ? "No notes match your search" : "No notes yet"}</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "Try adjusting your search terms."
                    : "Start by adding notes or use the sample notes button below."}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  {!searchQuery && (
                    <>
                      <Button onClick={() => setDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Your First Note
                      </Button>
                      <Button variant="outline" onClick={handleAddSampleNotes}>
                        Add Sample Notes
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

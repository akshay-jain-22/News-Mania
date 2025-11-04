"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bookmark, MessageSquare, Share2 } from "lucide-react"
import { saveArticle, addNote, trackInteraction } from "@/lib/interactions-service"
import { useAuth } from "@/lib/auth"

interface ArticleActionsProps {
  articleId: string
  articleTitle: string
  userId?: string
}

export function ArticleActions({ articleId, articleTitle, userId: propUserId }: ArticleActionsProps) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [noting, setNoting] = useState(false)

  const userId =
    propUserId || user?.id || (typeof window !== "undefined" ? localStorage.getItem("anon-user-id") : null) || ""

  const handleSave = async () => {
    if (!userId) return

    setSaving(true)
    try {
      await saveArticle(userId, articleId, articleTitle)
    } finally {
      setSaving(false)
    }
  }

  const handleNote = async () => {
    if (!userId) return

    setNoting(true)
    try {
      const note = prompt("Add a note about this article:")
      if (note) {
        await addNote(userId, articleId, articleTitle, note)
      }
    } finally {
      setNoting(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: articleTitle,
          text: "Check out this article",
          url: window.location.href,
        })
        await trackInteraction({
          userId,
          articleId,
          type: "share",
        })
      } catch (error) {
        console.log("[v0] Share cancelled or failed")
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={handleNote}
        disabled={noting}
        title="Add a note"
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
        onClick={handleSave}
        disabled={saving}
        title="Save article"
      >
        <Bookmark className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={handleShare} title="Share article">
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

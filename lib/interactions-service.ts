import { createBrowserClient } from "@supabase/ssr"
import { toast } from "@/components/ui/use-toast"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
)

export type InteractionType = "view" | "read_complete" | "save" | "share" | "note" | "summarize" | "qa"

export interface Interaction {
  userId: string
  articleId: string
  type: InteractionType
  duration?: number
  metadata?: Record<string, unknown>
}

export async function trackInteraction(interaction: Interaction) {
  try {
    const { data, error } = await supabase.from("interactions").insert({
      user_id: interaction.userId,
      article_id: interaction.articleId,
      type: interaction.type,
      duration: interaction.duration,
      metadata: interaction.metadata,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[v0] Error tracking interaction:", error)
      return false
    }

    // Trigger recommendations recompute in background
    try {
      await fetch("/api/ml/invalidate-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: interaction.userId }),
      })
    } catch (e) {
      console.log("[v0] Background recompute triggered")
    }

    return true
  } catch (error) {
    console.error("[v0] Track interaction error:", error)
    return false
  }
}

export function subscribeToRecommendationUpdates(
  userId: string,
  onUpdate: (update: { articleId: string; score: number; reason: string; updatedAt: string }) => void,
  onError?: (error: Error) => void,
) {
  const channel = supabase.channel(`recs:${userId}`)

  channel.subscribe((status) => {
    console.log(`[v0] Subscription status for recs:${userId}:`, status)
  })

  const subscription = channel
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "recommendations_cache",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        console.log("[v0] Received recommendation update:", payload)
        if (payload.new) {
          const rec = payload.new as any
          onUpdate({
            articleId: rec.recommendations?.[0]?.articleId || "",
            score: rec.recommendations?.[0]?.score || 0,
            reason: rec.recommendations?.[0]?.explanation || "",
            updatedAt: rec.updated_at,
          })
        }
      },
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel)
  }
}

export async function saveArticle(userId: string, articleId: string, title: string) {
  try {
    // Insert into interactions for tracking
    await trackInteraction({
      userId,
      articleId,
      type: "save",
      metadata: { title },
    })

    // Also insert into bookmarks table for persistence
    const { error } = await supabase.from("bookmarks").insert({
      user_id: userId,
      article_id: articleId,
      article_title: title,
      created_at: new Date().toISOString(),
    })

    if (error && !error.message.includes("duplicate")) {
      console.error("[v0] Error saving article:", error)
      return false
    }

    toast({
      title: "Article saved",
      description: "You can find it in your saved articles.",
    })

    return true
  } catch (error) {
    console.error("[v0] Save article error:", error)
    toast({
      title: "Error",
      description: "Failed to save article.",
      variant: "destructive",
    })
    return false
  }
}

export async function addNote(userId: string, articleId: string, title: string, content: string) {
  try {
    // Insert note
    const { error } = await supabase.from("notes").insert({
      user_id: userId,
      article_id: articleId,
      article_title: title,
      title: "Note",
      content,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[v0] Error adding note:", error)
      return false
    }

    // Track interaction
    await trackInteraction({
      userId,
      articleId,
      type: "note",
      metadata: { noteLength: content.length },
    })

    toast({
      title: "Note added",
      description: "Your note has been saved.",
    })

    return true
  } catch (error) {
    console.error("[v0] Add note error:", error)
    toast({
      title: "Error",
      description: "Failed to add note.",
      variant: "destructive",
    })
    return false
  }
}

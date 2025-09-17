import type { NewsArticle } from "@/types/news"

export async function shareArticle(article: NewsArticle): Promise<void> {
  try {
    // Check if Web Share API is supported
    if (navigator.share) {
      await navigator.share({
        title: article.title,
        text: article.description || article.title,
        url: article.url,
      })
    } else {
      // Fallback to clipboard
      const shareText = `${article.title}\n\n${article.description || ""}\n\nRead more: ${article.url}`

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText)
        console.log("Article copied to clipboard")
      } else {
        // Final fallback - create temporary textarea
        const textarea = document.createElement("textarea")
        textarea.value = shareText
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand("copy")
        document.body.removeChild(textarea)
        console.log("Article copied to clipboard (fallback)")
      }
    }
  } catch (error) {
    console.error("Error sharing article:", error)
    throw new Error("Failed to share article")
  }
}

export function getShareUrl(article: NewsArticle): string {
  return article.url
}

export function getShareText(article: NewsArticle): string {
  return `${article.title}\n\n${article.description || ""}\n\nRead more: ${article.url}`
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    } else {
      // Fallback for older browsers
      const textarea = document.createElement("textarea")
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }
  } catch (error) {
    console.error("Error copying to clipboard:", error)
    throw new Error("Failed to copy to clipboard")
  }
}

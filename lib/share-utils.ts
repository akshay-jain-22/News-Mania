import type { NewsArticle } from "@/types/news"

export interface ShareOptions {
  title: string
  text: string
  url: string
}

export async function shareArticle(article: NewsArticle): Promise<void> {
  const shareData: ShareOptions = {
    title: article.title,
    text: `${article.description}\n\nSource: ${article.source?.name || "News"}`,
    url: article.url,
  }

  try {
    // Try native Web Share API first (mobile/modern browsers)
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      console.log("Using native share API")
      await navigator.share(shareData)
      return
    }

    // Fallback to clipboard
    console.log("Using clipboard fallback")
    await copyToClipboard(shareData)
  } catch (error) {
    console.error("Error sharing article:", error)
    // Final fallback - just copy URL
    await copyTextToClipboard(article.url)
  }
}

export async function shareToTwitter(article: NewsArticle): Promise<void> {
  const text = encodeURIComponent(`${article.title}\n\n${article.description}`)
  const url = encodeURIComponent(article.url)
  const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`

  window.open(twitterUrl, "_blank", "width=600,height=400")
}

export async function shareToFacebook(article: NewsArticle): Promise<void> {
  const url = encodeURIComponent(article.url)
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`

  window.open(facebookUrl, "_blank", "width=600,height=400")
}

export async function shareToLinkedIn(article: NewsArticle): Promise<void> {
  const url = encodeURIComponent(article.url)
  const title = encodeURIComponent(article.title)
  const summary = encodeURIComponent(article.description || "")
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`

  window.open(linkedInUrl, "_blank", "width=600,height=400")
}

export async function shareToReddit(article: NewsArticle): Promise<void> {
  const url = encodeURIComponent(article.url)
  const title = encodeURIComponent(article.title)
  const redditUrl = `https://reddit.com/submit?url=${url}&title=${title}`

  window.open(redditUrl, "_blank", "width=600,height=400")
}

export async function shareToWhatsApp(article: NewsArticle): Promise<void> {
  const text = encodeURIComponent(`${article.title}\n\n${article.description}\n\n${article.url}`)
  const whatsappUrl = `https://wa.me/?text=${text}`

  window.open(whatsappUrl, "_blank")
}

export async function shareToTelegram(article: NewsArticle): Promise<void> {
  const text = encodeURIComponent(`${article.title}\n\n${article.description}`)
  const url = encodeURIComponent(article.url)
  const telegramUrl = `https://t.me/share/url?url=${url}&text=${text}`

  window.open(telegramUrl, "_blank")
}

export async function shareViaEmail(article: NewsArticle): Promise<void> {
  const subject = encodeURIComponent(`Interesting article: ${article.title}`)
  const body = encodeURIComponent(
    `I thought you might find this article interesting:\n\n${article.title}\n\n${article.description}\n\nRead more: ${article.url}\n\nShared via NewsPortal`,
  )
  const emailUrl = `mailto:?subject=${subject}&body=${body}`

  window.location.href = emailUrl
}

async function copyToClipboard(shareData: ShareOptions): Promise<void> {
  const textToCopy = `${shareData.title}\n\n${shareData.text}\n\nRead more: ${shareData.url}`

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(textToCopy)
      console.log("Copied to clipboard using Clipboard API")
    } else {
      // Fallback for older browsers
      await copyTextToClipboard(textToCopy)
    }
  } catch (error) {
    console.error("Error copying to clipboard:", error)
    throw new Error("Failed to copy to clipboard")
  }
}

async function copyTextToClipboard(text: string): Promise<void> {
  try {
    // Create a temporary textarea element
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)

    // Select and copy the text
    textarea.select()
    textarea.setSelectionRange(0, 99999) // For mobile devices

    const successful = document.execCommand("copy")
    document.body.removeChild(textarea)

    if (!successful) {
      throw new Error("Copy command failed")
    }

    console.log("Copied to clipboard using fallback method")
  } catch (error) {
    console.error("Fallback copy failed:", error)
    throw new Error("Failed to copy text")
  }
}

export function getShareableUrl(article: NewsArticle): string {
  // Return the article URL or create a shareable link
  return article.url || `${window.location.origin}/article/${article.id}`
}

export function generateShareText(article: NewsArticle, platform?: string): string {
  const baseText = `${article.title}\n\n${article.description}`
  const source = article.source?.name ? `\nSource: ${article.source.name}` : ""
  const url = `\n\n${article.url}`

  switch (platform) {
    case "twitter":
      // Twitter has character limits, so keep it concise
      const shortText = article.title.length > 100 ? `${article.title.substring(0, 100)}...` : article.title
      return `${shortText}${url}`

    case "linkedin":
      // LinkedIn allows longer posts
      return `${baseText}${source}${url}`

    case "email":
      return `I thought you might find this article interesting:\n\n${baseText}${source}${url}\n\nShared via NewsPortal`

    default:
      return `${baseText}${source}${url}`
  }
}

// Check if sharing is supported
export function isSharingSupported(): boolean {
  return !!(navigator.share || navigator.clipboard)
}

// Check if native sharing is available
export function isNativeSharingSupported(): boolean {
  return !!(navigator.share && navigator.canShare)
}

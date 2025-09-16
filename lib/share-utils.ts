export interface ShareContent {
  title: string
  description: string
  url: string
  source?: string
}

export interface SharePlatform {
  id: string
  name: string
  icon: string
  url: (content: ShareContent) => string
}

export async function shareContent(content: ShareContent): Promise<boolean> {
  // Try Web Share API first (mobile/modern browsers)
  if (navigator.share) {
    try {
      await navigator.share({
        title: content.title,
        text: content.description,
        url: content.url,
      })
      return true
    } catch (error) {
      console.log("Web Share API failed:", error)
      // Fall through to other methods
    }
  }

  // Fallback: copy to clipboard
  try {
    const shareText = `${content.title}\n\n${content.description}\n\n${content.url}`
    await navigator.clipboard.writeText(shareText)
    return true
  } catch (error) {
    console.error("Clipboard API failed:", error)
    return false
  }
}

export function getAvailableSharePlatforms(): SharePlatform[] {
  return [
    {
      id: "twitter",
      name: "Twitter",
      icon: "🐦",
      url: (content) =>
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(content.title)}&url=${encodeURIComponent(content.url)}`,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: "📘",
      url: (content) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(content.url)}`,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: "💼",
      url: (content) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(content.url)}`,
    },
    {
      id: "reddit",
      name: "Reddit",
      icon: "🔴",
      url: (content) =>
        `https://reddit.com/submit?url=${encodeURIComponent(content.url)}&title=${encodeURIComponent(content.title)}`,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: "💬",
      url: (content) => `https://wa.me/?text=${encodeURIComponent(`${content.title} ${content.url}`)}`,
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: "✈️",
      url: (content) =>
        `https://t.me/share/url?url=${encodeURIComponent(content.url)}&text=${encodeURIComponent(content.title)}`,
    },
    {
      id: "email",
      name: "Email",
      icon: "📧",
      url: (content) =>
        `mailto:?subject=${encodeURIComponent(content.title)}&body=${encodeURIComponent(`${content.description}\n\n${content.url}`)}`,
    },
    {
      id: "copy",
      name: "Copy Link",
      icon: "📋",
      url: (content) => content.url,
    },
  ]
}

export function openPlatformShare(platformId: string, content: ShareContent): void {
  const platforms = getAvailableSharePlatforms()
  const platform = platforms.find((p) => p.id === platformId)

  if (!platform) {
    console.error("Platform not found:", platformId)
    return
  }

  if (platformId === "copy") {
    // Handle copy to clipboard
    navigator.clipboard
      .writeText(content.url)
      .then(() => {
        console.log("Link copied to clipboard")
      })
      .catch((error) => {
        console.error("Failed to copy link:", error)
      })
    return
  }

  // Open share URL in new window/tab
  const shareUrl = platform.url(content)
  window.open(shareUrl, "_blank", "noopener,noreferrer")
}

export function generateShareText(content: ShareContent): string {
  let shareText = content.title

  if (content.description) {
    shareText += `\n\n${content.description}`
  }

  if (content.source) {
    shareText += `\n\nSource: ${content.source}`
  }

  shareText += `\n\n${content.url}`

  return shareText
}

export function isWebShareSupported(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator
}

export function isClipboardSupported(): boolean {
  return typeof navigator !== "undefined" && "clipboard" in navigator
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (isClipboardSupported()) {
      await navigator.clipboard.writeText(text)
      return true
    }

    // Fallback for older browsers
    const textArea = document.createElement("textarea")
    textArea.value = text
    textArea.style.position = "fixed"
    textArea.style.left = "-999999px"
    textArea.style.top = "-999999px"
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    const result = document.execCommand("copy")
    document.body.removeChild(textArea)

    return result
  } catch (error) {
    console.error("Failed to copy to clipboard:", error)
    return false
  }
}

export function getShareableUrl(articleUrl: string, source?: string): string {
  // If it's already a full URL, return as is
  if (articleUrl.startsWith("http")) {
    return articleUrl
  }

  // If it's a relative URL, make it absolute
  if (typeof window !== "undefined") {
    return new URL(articleUrl, window.location.origin).toString()
  }

  // Fallback for server-side
  return articleUrl
}

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
  available: boolean
}

/**
 * Share content using the Web Share API or fallback to clipboard
 */
export async function shareContent(content: ShareContent): Promise<boolean> {
  try {
    // Check if Web Share API is available
    if (navigator.share) {
      await navigator.share({
        title: content.title,
        text: content.description,
        url: content.url,
      })
      return true
    }

    // Fallback to clipboard
    const shareText = `${content.title}\n\n${content.description}\n\nRead more: ${content.url}`

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText)
      return true
    }

    // Final fallback for older browsers
    const textArea = document.createElement("textarea")
    textArea.value = shareText
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand("copy")
    document.body.removeChild(textArea)

    return true
  } catch (error) {
    console.error("Error sharing content:", error)
    return false
  }
}

/**
 * Open platform-specific share dialog
 */
export function openPlatformShare(platform: string, content: ShareContent): void {
  const encodedTitle = encodeURIComponent(content.title)
  const encodedDescription = encodeURIComponent(content.description)
  const encodedUrl = encodeURIComponent(content.url)

  let shareUrl = ""

  switch (platform) {
    case "twitter":
      shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
      break
    case "facebook":
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`
      break
    case "linkedin":
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`
      break
    case "reddit":
      shareUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`
      break
    case "whatsapp":
      shareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`
      break
    case "telegram":
      shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`
      break
    case "email":
      shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0ARead more: ${encodedUrl}`
      break
    case "copy":
      copyToClipboard(content)
      return
    default:
      console.error("Unknown share platform:", platform)
      return
  }

  if (shareUrl) {
    window.open(shareUrl, "_blank", "width=600,height=400,scrollbars=yes,resizable=yes")
  }
}

/**
 * Copy content to clipboard
 */
async function copyToClipboard(content: ShareContent): Promise<void> {
  const shareText = `${content.title}\n\n${content.description}\n\nRead more: ${content.url}`

  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText)
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = shareText
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    }
  } catch (error) {
    console.error("Error copying to clipboard:", error)
  }
}

/**
 * Get available share platforms
 */
export function getAvailableSharePlatforms(): SharePlatform[] {
  return [
    {
      id: "twitter",
      name: "Twitter",
      icon: "🐦",
      available: true,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: "📘",
      available: true,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: "💼",
      available: true,
    },
    {
      id: "reddit",
      name: "Reddit",
      icon: "🤖",
      available: true,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      icon: "💬",
      available: true,
    },
    {
      id: "telegram",
      name: "Telegram",
      icon: "✈️",
      available: true,
    },
    {
      id: "email",
      name: "Email",
      icon: "📧",
      available: true,
    },
    {
      id: "copy",
      name: "Copy Link",
      icon: "📋",
      available: true,
    },
  ]
}

/**
 * Check if Web Share API is available
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator
}

/**
 * Share article with smart fallbacks
 */
export async function shareArticle(article: {
  title: string
  description?: string
  url: string
  source?: { name: string }
}): Promise<boolean> {
  const content: ShareContent = {
    title: article.title,
    description: article.description || "Check out this news article",
    url: article.url,
    source: article.source?.name,
  }

  return await shareContent(content)
}

export interface ShareData {
  title: string
  text: string
  url: string
}

export interface SharePlatform {
  name: string
  icon: string
  url: string
  color: string
}

/**
 * Share content using Web Share API or fallback to platform-specific sharing
 */
export async function shareContent(data: ShareData): Promise<boolean> {
  try {
    // Check if Web Share API is supported
    if (navigator.share && navigator.canShare && navigator.canShare(data)) {
      await navigator.share(data)
      return true
    } else {
      // Fallback to opening share dialog with available platforms
      return openShareDialog(data)
    }
  } catch (error) {
    console.error("Error sharing content:", error)

    // If Web Share API fails, try fallback
    return openShareDialog(data)
  }
}

/**
 * Open platform-specific share dialog
 */
function openShareDialog(data: ShareData): boolean {
  try {
    const platforms = getAvailableSharePlatforms(data)

    if (platforms.length === 0) {
      // Copy to clipboard as last resort
      return copyToClipboard(data.url)
    }

    // For now, default to Twitter sharing
    const twitterPlatform = platforms.find((p) => p.name === "Twitter")
    if (twitterPlatform) {
      window.open(twitterPlatform.url, "_blank", "width=600,height=400")
      return true
    }

    // Fallback to first available platform
    window.open(platforms[0].url, "_blank", "width=600,height=400")
    return true
  } catch (error) {
    console.error("Error opening share dialog:", error)
    return copyToClipboard(data.url)
  }
}

/**
 * Get available share platforms with URLs
 */
export function getAvailableSharePlatforms(data: ShareData): SharePlatform[] {
  const encodedTitle = encodeURIComponent(data.title)
  const encodedText = encodeURIComponent(data.text)
  const encodedUrl = encodeURIComponent(data.url)

  const platforms: SharePlatform[] = [
    {
      name: "Twitter",
      icon: "🐦",
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: "#1DA1F2",
    },
    {
      name: "Facebook",
      icon: "📘",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
      color: "#4267B2",
    },
    {
      name: "LinkedIn",
      icon: "💼",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`,
      color: "#0077B5",
    },
    {
      name: "Reddit",
      icon: "🔴",
      url: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      color: "#FF4500",
    },
    {
      name: "WhatsApp",
      icon: "💬",
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: "#25D366",
    },
    {
      name: "Telegram",
      icon: "✈️",
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      color: "#0088CC",
    },
    {
      name: "Email",
      icon: "📧",
      url: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
      color: "#666666",
    },
  ]

  // Filter platforms based on device capabilities
  return platforms.filter((platform) => {
    // All platforms are available on web
    return true
  })
}

/**
 * Open platform-specific share URL
 */
export function openPlatformShare(platform: SharePlatform): void {
  try {
    if (platform.name === "Email") {
      // Email opens in default mail client
      window.location.href = platform.url
    } else {
      // Other platforms open in new window
      window.open(platform.url, "_blank", "width=600,height=400,scrollbars=yes,resizable=yes")
    }
  } catch (error) {
    console.error(`Error opening ${platform.name} share:`, error)
  }
}

/**
 * Copy text to clipboard
 */
function copyToClipboard(text: string): boolean {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      const successful = document.execCommand("copy")
      document.body.removeChild(textArea)

      return successful
    }
  } catch (error) {
    console.error("Error copying to clipboard:", error)
    return false
  }
}

/**
 * Check if Web Share API is supported
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator
}

/**
 * Check if a specific share data can be shared
 */
export function canShare(data: ShareData): boolean {
  if (typeof navigator === "undefined") return false

  return navigator.canShare ? navigator.canShare(data) : isWebShareSupported()
}

/**
 * Generate share text for news articles
 */
export function generateNewsShareText(title: string, source?: string): string {
  let shareText = `Check out this news: ${title}`

  if (source) {
    shareText += ` (via ${source})`
  }

  return shareText
}

/**
 * Generate share data for news articles
 */
export function generateNewsShareData(title: string, url: string, source?: string, description?: string): ShareData {
  return {
    title,
    text: description || generateNewsShareText(title, source),
    url,
  }
}

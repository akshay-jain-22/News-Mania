export interface ShareData {
  title: string
  text: string
  url: string
  image?: string
}

export interface ShareOptions {
  fallbackMessage?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/**
 * Share content using the Web Share API or fallback methods
 */
export async function shareContent(data: ShareData, options: ShareOptions = {}): Promise<boolean> {
  const { fallbackMessage = "Content copied to clipboard!", onSuccess, onError } = options

  try {
    // Check if Web Share API is supported
    if (navigator.share && navigator.canShare && navigator.canShare(data)) {
      await navigator.share(data)
      onSuccess?.()
      return true
    }

    // Fallback to clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      const shareText = `${data.title}\n\n${data.text}\n\n${data.url}`
      await navigator.clipboard.writeText(shareText)

      // Show success message
      if (typeof window !== "undefined" && window.alert) {
        window.alert(fallbackMessage)
      }

      onSuccess?.()
      return true
    }

    // Final fallback - create a temporary textarea
    const textArea = document.createElement("textarea")
    textArea.value = `${data.title}\n\n${data.text}\n\n${data.url}`
    textArea.style.position = "fixed"
    textArea.style.left = "-999999px"
    textArea.style.top = "-999999px"
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    const successful = document.execCommand("copy")
    document.body.removeChild(textArea)

    if (successful) {
      if (typeof window !== "undefined" && window.alert) {
        window.alert(fallbackMessage)
      }
      onSuccess?.()
      return true
    }

    throw new Error("Unable to share or copy content")
  } catch (error) {
    console.error("Error sharing content:", error)
    onError?.(error as Error)
    return false
  }
}

/**
 * Share article with formatted content
 */
export async function shareArticle(
  title: string,
  description: string,
  url: string,
  options: ShareOptions = {},
): Promise<boolean> {
  const shareData: ShareData = {
    title: `📰 ${title}`,
    text: description || "Check out this interesting news article!",
    url: url,
  }

  return shareContent(shareData, {
    fallbackMessage: "Article link copied to clipboard!",
    ...options,
  })
}

/**
 * Share content on a specific platform
 */
export function shareOnPlatform(
  platform: "twitter" | "facebook" | "linkedin" | "reddit" | "whatsapp" | "telegram",
  data: ShareData,
): void {
  const encodedTitle = encodeURIComponent(data.title)
  const encodedText = encodeURIComponent(data.text)
  const encodedUrl = encodeURIComponent(data.url)

  let shareUrl = ""

  switch (platform) {
    case "twitter":
      shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`
      break
    case "facebook":
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`
      break
    case "linkedin":
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedText}`
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
    default:
      console.error("Unsupported platform:", platform)
      return
  }

  if (shareUrl) {
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=400")
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
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

    const successful = document.execCommand("copy")
    document.body.removeChild(textArea)

    return successful
  } catch (error) {
    console.error("Error copying to clipboard:", error)
    return false
  }
}

/**
 * Generate sharing URLs for different platforms
 */
export function generateSharingUrls(data: ShareData): Record<string, string> {
  const { title, text, url } = data
  const shareText = text ? `${title} - ${text}` : title
  const encodedText = encodeURIComponent(shareText)
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodeURIComponent(text || "")}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`,
    sms: `sms:?body=${encodedText}%20${encodedUrl}`,
  }
}

/**
 * Check if Web Share API is supported
 */
export function isWebShareSupported(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator
}

/**
 * Check if clipboard API is supported
 */
export function isClipboardSupported(): boolean {
  return typeof navigator !== "undefined" && "clipboard" in navigator && "writeText" in navigator.clipboard
}

/**
 * Get available share methods
 */
export function getAvailableShareMethods(): {
  webShare: boolean
  clipboard: boolean
  fallback: boolean
} {
  return {
    webShare: isWebShareSupported(),
    clipboard: isClipboardSupported(),
    fallback: typeof document !== "undefined" && "execCommand" in document,
  }
}

/**
 * Share via email
 */
export function shareViaEmail(subject: string, body: string, to?: string): void {
  const encodedSubject = encodeURIComponent(subject)
  const encodedBody = encodeURIComponent(body)
  const encodedTo = to ? encodeURIComponent(to) : ""

  const mailtoUrl = `mailto:${encodedTo}?subject=${encodedSubject}&body=${encodedBody}`

  if (typeof window !== "undefined") {
    window.location.href = mailtoUrl
  }
}

/**
 * Share via SMS
 */
export function shareViaSMS(message: string, phoneNumber?: string): void {
  const encodedMessage = encodeURIComponent(message)
  const encodedNumber = phoneNumber ? encodeURIComponent(phoneNumber) : ""

  const smsUrl = `sms:${encodedNumber}?body=${encodedMessage}`

  if (typeof window !== "undefined") {
    window.location.href = smsUrl
  }
}

/**
 * Create shareable link with tracking parameters
 */
export function generateShareableLink(baseUrl: string, params: Record<string, string> = {}): string {
  try {
    const url = new URL(baseUrl)

    // Add default tracking parameters
    url.searchParams.set("utm_source", "share")
    url.searchParams.set("utm_medium", "social")
    url.searchParams.set("utm_campaign", "news_share")

    // Add custom parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })

    return url.toString()
  } catch (error) {
    console.error("Error generating shareable link:", error)
    return baseUrl
  }
}

/**
 * Create share button data
 */
export function createShareButtonData(
  title: string,
  description: string,
  url: string,
  imageUrl?: string,
): ShareData & { image?: string } {
  return {
    title,
    text: description,
    url,
    ...(imageUrl && { image: imageUrl }),
  }
}

/**
 * Format share text for different platforms
 */
export function formatShareText(
  platform: "twitter" | "facebook" | "linkedin" | "general",
  title: string,
  description: string,
  url: string,
  hashtags: string[] = [],
): string {
  const hashtagString = hashtags.length > 0 ? ` ${hashtags.map((tag) => `#${tag}`).join(" ")}` : ""

  switch (platform) {
    case "twitter":
      // Twitter has character limits, so keep it concise
      const twitterText = `${title}${hashtagString}`
      return twitterText.length > 240 ? `${twitterText.substring(0, 237)}...` : twitterText

    case "facebook":
      return `${title}\n\n${description}${hashtagString}`

    case "linkedin":
      return `${title}\n\n${description}\n\nRead more: ${url}${hashtagString}`

    case "general":
    default:
      return `${title}\n\n${description}\n\n${url}${hashtagString}`
  }
}

export default {
  shareContent,
  shareArticle,
  shareOnPlatform,
  copyToClipboard,
  generateSharingUrls,
  isWebShareSupported,
  isClipboardSupported,
  getAvailableShareMethods,
  shareViaEmail,
  shareViaSMS,
  generateShareableLink,
  createShareButtonData,
  formatShareText,
}

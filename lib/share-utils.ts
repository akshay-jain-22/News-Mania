export interface ShareData {
  title: string
  description?: string
  url: string
  source?: string
}

export interface SharePlatform {
  id: string
  name: string
  icon: string
  urlTemplate: string
}

export async function shareContent(data: ShareData): Promise<boolean> {
  // Try native Web Share API first
  if (navigator.share) {
    try {
      await navigator.share({
        title: data.title,
        text: data.description,
        url: data.url,
      })
      return true
    } catch (error) {
      console.log("Native share cancelled or failed:", error)
      return false
    }
  }

  // Fallback to clipboard
  try {
    const shareText = `${data.title}\n\n${data.description || ""}\n\nRead more: ${data.url}\n\nSource: ${data.source || "News"}`
    await navigator.clipboard.writeText(shareText)
    return true
  } catch (error) {
    console.error("Clipboard share failed:", error)
    return false
  }
}

export function generateNewsShareData(title: string, url: string, source: string, description?: string): ShareData {
  return {
    title: `${title} - ${source}`,
    description: description || `Read this article from ${source}`,
    url,
    source,
  }
}

export function getAvailableSharePlatforms(): SharePlatform[] {
  return [
    {
      id: "twitter",
      name: "Twitter",
      icon: "🐦",
      urlTemplate: "https://twitter.com/intent/tweet?text={title}&url={url}",
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: "📘",
      urlTemplate: "https://www.facebook.com/sharer/sharer.php?u={url}",
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: "💼",
      urlTemplate: "https://www.linkedin.com/sharing/share-offsite/?url={url}",
    },
    {
      id: "reddit",
      name: "Reddit",
      icon: "🔴",
      urlTemplate: "https://reddit.com/submit?url={url}&title={title}",
    },
    {
      id: "email",
      name: "Email",
      icon: "📧",
      urlTemplate: "mailto:?subject={title}&body={description}%0A%0A{url}",
    },
    {
      id: "copy",
      name: "Copy Link",
      icon: "📋",
      urlTemplate: "",
    },
  ]
}

export function openPlatformShare(platformId: string, data: ShareData): void {
  const platforms = getAvailableSharePlatforms()
  const platform = platforms.find((p) => p.id === platformId)

  if (!platform) return

  if (platformId === "copy") {
    navigator.clipboard
      .writeText(data.url)
      .then(() => {
        console.log("Link copied to clipboard")
      })
      .catch((err) => {
        console.error("Failed to copy link:", err)
      })
    return
  }

  const url = platform.urlTemplate
    .replace("{title}", encodeURIComponent(data.title))
    .replace("{url}", encodeURIComponent(data.url))
    .replace("{description}", encodeURIComponent(data.description || ""))

  window.open(url, "_blank", "width=600,height=400")
}

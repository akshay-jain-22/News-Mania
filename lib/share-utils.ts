interface ShareData {
  title: string
  text: string
  url: string
}

export async function shareArticle(article: {
  title: string
  description?: string
  url: string
  source: { name: string }
}): Promise<boolean> {
  const shareData: ShareData = {
    title: article.title,
    text: `${article.description || ""} - via ${article.source.name}`,
    url: article.url,
  }

  // Check if Web Share API is supported
  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData)
      return true
    } catch (error) {
      console.error("Error sharing:", error)
      // Fall back to clipboard
      return copyToClipboard(shareData)
    }
  } else {
    // Fall back to clipboard
    return copyToClipboard(shareData)
  }
}

export async function copyToClipboard(shareData: ShareData): Promise<boolean> {
  const textToShare = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`

  try {
    await navigator.clipboard.writeText(textToShare)
    return true
  } catch (error) {
    console.error("Error copying to clipboard:", error)

    // Fallback for older browsers
    const textArea = document.createElement("textarea")
    textArea.value = textToShare
    document.body.appendChild(textArea)
    textArea.select()

    try {
      document.execCommand("copy")
      document.body.removeChild(textArea)
      return true
    } catch (fallbackError) {
      console.error("Fallback copy failed:", fallbackError)
      document.body.removeChild(textArea)
      return false
    }
  }
}

export function getShareUrls(article: {
  title: string
  description?: string
  url: string
}) {
  const encodedTitle = encodeURIComponent(article.title)
  const encodedUrl = encodeURIComponent(article.url)
  const encodedText = encodeURIComponent(article.description || "")

  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
  }
}

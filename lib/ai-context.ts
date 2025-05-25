/**
 * Get additional context for a news article using AI
 */
export async function getNewsContext(title: string, description: string, content: string): Promise<string> {
  try {
    console.log("Requesting context for article:", title)

    // Add a timeout to the fetch to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout

    const response = await fetch("/api/news-context", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        content,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`Failed to fetch news context: ${response.status}`)

      // Provide a fallback based on the article title
      return `This article about "${title}" may benefit from additional context. While we couldn't generate specific background information at this moment, you can research more about this topic through reliable news sources.`
    }

    const data = await response.json()

    // Check if we got a valid context response
    if (!data.context || data.context.trim() === "") {
      return `This article titled "${title}" may require additional context. Consider checking multiple news sources to get a more complete understanding of this topic.`
    }

    return data.context
  } catch (error) {
    console.error("Error getting news context:", error)

    // Check if it's an abort error (timeout)
    if (error instanceof DOMException && error.name === "AbortError") {
      return "The request for additional context timed out. This might be due to high demand or temporary service limitations. Please try again in a few moments."
    }

    // Provide a more helpful fallback that includes the article title
    return `We couldn't retrieve additional context for "${title}" at this time. This might be due to temporary service limitations. You can still research this topic through other reliable news sources.`
  }
}

/**
 * Ask AI a question about a specific news article
 */
export async function askAIAboutArticle(
  title: string,
  description: string,
  content: string,
  question: string,
): Promise<string> {
  try {
    console.log("Asking AI about article:", title)
    console.log("Question:", question)

    // Add a timeout to the fetch to prevent hanging requests
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout

    const response = await fetch("/api/news-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        content,
        question,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`Failed to get AI response: ${response.status}`)
      return `I couldn't analyze this article to answer your question at the moment. This might be due to temporary service limitations. You might want to try a different question or try again later.`
    }

    const data = await response.json()
    return (
      data.response ||
      "I couldn't generate a specific response to your question, but I can try to answer a different question about this article."
    )
  } catch (error) {
    console.error("Error getting AI response:", error)

    // Check if it's an abort error (timeout)
    if (error instanceof DOMException && error.name === "AbortError") {
      return "The request timed out while processing your question. This might be due to high demand or temporary service limitations. Please try again in a few moments."
    }

    return `I'm sorry, but I couldn't process your question about this article at this time. This might be due to temporary service limitations. Please try again later or ask a different question.`
  }
}

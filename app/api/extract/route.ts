import { NextResponse } from "next/server"
import * as cheerio from "cheerio"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
  }

  try {
    // Fetch the HTML content from the URL
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch URL" }, { status: response.status })
    }

    const html = await response.text()

    // Use cheerio to parse the HTML
    const $ = cheerio.load(html)

    // Extract the title
    const title = $("title").text() || $("h1").first().text()

    // Extract the main content
    // This is a simple implementation and might need to be adjusted for different websites
    let content = ""

    // Try to find the main article content
    const articleSelectors = [
      "article",
      ".article-content",
      ".post-content",
      ".entry-content",
      ".content",
      "main",
      ".story-body",
      ".article-body",
      ".article__body",
      ".story__body",
      ".post__body",
      ".entry__content",
      ".news-article",
      ".news-content",
      "#article-body",
      "#story-body",
      "#content-body",
      "#main-content",
    ]

    let foundContent = false
    for (const selector of articleSelectors) {
      const element = $(selector)
      if (element.length) {
        // Remove script and style tags and other non-content elements
        element
          .find(
            "script, style, nav, header, footer, .ad, .advertisement, .social-share, .related-posts, .comments, .sidebar",
          )
          .remove()

        // Get text content with paragraph breaks
        content = ""
        element.find("p, h2, h3, h4, h5, h6, blockquote, li").each((i, el) => {
          const text = $(el).text().trim()
          if (text) {
            content += text + "\n\n"
          }
        })

        if (content.trim().length > 100) {
          foundContent = true
          break
        }
      }
    }

    // If no content was found with the selectors, get the body text
    if (!foundContent) {
      // Remove script, style, nav, header, footer tags
      $(
        "script, style, nav, header, footer, .ad, .advertisement, .social-share, .related-posts, .comments, .sidebar",
      ).remove()

      // Get text content with paragraph breaks
      content = ""
      $("body")
        .find("p, h2, h3, h4, h5, h6, blockquote, li")
        .each((i, el) => {
          const text = $(el).text().trim()
          if (text) {
            content += text + "\n\n"
          }
        })
    }

    // Clean up the content
    content = content.replace(/\s+/g, " ").trim()

    // Create a summary (first 200 characters)
    const summary = content.substring(0, 200) + "..."

    // Get the source domain
    const source = new URL(url).hostname

    // Get the current date
    const date = new Date().toISOString()

    // Extract main image
    let image = null

    // Try to find meta og:image
    const ogImage = $('meta[property="og:image"]').attr("content") || $('meta[name="og:image"]').attr("content")
    if (ogImage) {
      image = ogImage
    } else {
      // Try to find Twitter image
      const twitterImage = $('meta[name="twitter:image"]').attr("content")
      if (twitterImage) {
        image = twitterImage
      } else {
        // Try to find the first large image in the article
        const articleImages = $(
          "article img, .article-content img, .post-content img, .entry-content img, .content img, main img, .story-body img, .article-body img",
        )

        if (articleImages.length > 0) {
          // Find the largest image (assuming it's the main one)
          let largestArea = 0
          articleImages.each((i, el) => {
            const width = Number.parseInt($(el).attr("width") || "0", 10)
            const height = Number.parseInt($(el).attr("height") || "0", 10)

            // Skip small images and icons
            if (width < 100 || height < 100) return

            if (width && height && width * height > largestArea) {
              largestArea = width * height
              image = $(el).attr("src") || null
            }
          })

          // If no image with dimensions found, just take the first one that's not tiny
          if (!image && articleImages.length > 0) {
            articleImages.each((i, el) => {
              const src = $(el).attr("src")
              if (src && !src.includes("icon") && !src.includes("logo")) {
                image = src
                return false // break the loop
              }
            })
          }
        }
      }
    }

    // Make sure image URL is absolute
    if (image && !image.startsWith("http")) {
      try {
        image = new URL(image, url).href
      } catch (e) {
        console.error("Error converting relative URL to absolute:", e)
        image = null
      }
    }

    return NextResponse.json({
      title,
      content,
      summary,
      source,
      date,
      image,
    })
  } catch (error) {
    console.error("Error extracting content:", error)
    return NextResponse.json({ error: "Failed to extract content" }, { status: 500 })
  }
}

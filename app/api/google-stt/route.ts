// Google Cloud Speech-to-Text API endpoint
import { NextResponse } from "next/server"

const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY

export async function POST(request: Request) {
  try {
    const { audioContent } = await request.json()

    if (!audioContent) {
      return NextResponse.json({ error: "Audio content is required" }, { status: 400 })
    }

    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ error: "Google API key not configured" }, { status: 500 })
    }

    // Use Google Cloud Speech-to-Text REST API with API key
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          config: {
            encoding: "WEBM_OPUS",
            sampleRateHertz: 48000,
            languageCode: "en-US",
            enableAutomaticPunctuation: true,
          },
          audio: {
            content: audioContent,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error("[Google STT] API error:", error)
      return NextResponse.json({ error: "STT recognition failed", details: error }, { status: response.status })
    }

    const data = await response.json()

    const transcript = data.results
      ?.map((result: any) => result.alternatives?.[0]?.transcript)
      .filter(Boolean)
      .join(" ")

    return NextResponse.json({
      transcript: transcript || "",
      confidence: data.results?.[0]?.alternatives?.[0]?.confidence || 0,
    })
  } catch (error: any) {
    console.error("[Google STT] Error:", error)
    return NextResponse.json({ error: "Internal server error", message: error.message }, { status: 500 })
  }
}

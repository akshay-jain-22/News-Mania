// Google Cloud Text-to-Speech API endpoint using API key authentication
import { NextResponse } from "next/server"

const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY

const GOOGLE_TTS_ENDPOINT = `https://texttospeech.googleapis.com/v1/text:synthesize`

export async function POST(request: Request) {
  try {
    const { text, languageCode = "en-US", voiceName = "en-US-Neural2-F" } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    if (!GOOGLE_API_KEY) {
      return NextResponse.json({ error: "Google API key not configured" }, { status: 500 })
    }

    const response = await fetch(`${GOOGLE_TTS_ENDPOINT}?key=${GOOGLE_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode,
          name: voiceName,
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 1.0,
          pitch: 0.0,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[Google TTS] API error:", error)
      return NextResponse.json({ error: "TTS generation failed", details: error }, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json({
      audioContent: data.audioContent,
      contentType: "audio/mpeg",
    })
  } catch (error: any) {
    console.error("[Google TTS] Error:", error)
    return NextResponse.json({ error: "Internal server error", message: error.message }, { status: 500 })
  }
}

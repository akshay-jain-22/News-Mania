// Google Cloud Text-to-Speech API endpoint
import { NextResponse } from "next/server"

const GOOGLE_CREDENTIALS = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT
  ? JSON.parse(process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT)
  : null

const GOOGLE_TTS_ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize"

export async function POST(request: Request) {
  try {
    const { text, languageCode = "en-US", voiceName = "en-US-Neural2-F" } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    if (!GOOGLE_CREDENTIALS) {
      return NextResponse.json({ error: "Google Cloud credentials not configured" }, { status: 500 })
    }

    // Get access token from service account
    const accessToken = await getAccessToken()

    if (!accessToken) {
      return NextResponse.json({ error: "Failed to get access token" }, { status: 500 })
    }

    // Call Google Cloud TTS API
    const response = await fetch(GOOGLE_TTS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
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

    // Return audio content as base64
    return NextResponse.json({
      audioContent: data.audioContent,
      contentType: "audio/mpeg",
    })
  } catch (error: any) {
    console.error("[Google TTS] Error:", error)
    return NextResponse.json({ error: "Internal server error", message: error.message }, { status: 500 })
  }
}

async function getAccessToken(): Promise<string | null> {
  if (!GOOGLE_CREDENTIALS) return null

  try {
    const { GoogleAuth } = await import("google-auth-library")

    const auth = new GoogleAuth({
      credentials: GOOGLE_CREDENTIALS,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    })

    const client = await auth.getClient()
    const accessToken = await client.getAccessToken()

    return accessToken.token || null
  } catch (error) {
    console.error("[Google Auth] Error getting access token:", error)
    return null
  }
}

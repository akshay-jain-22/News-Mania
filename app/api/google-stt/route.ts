// Google Cloud Speech-to-Text API endpoint
import { NextResponse } from "next/server"

const GOOGLE_CREDENTIALS = process.env.GOOGLE_CLOUD_CREDENTIALS
  ? JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
  : null

const GOOGLE_STT_ENDPOINT = "https://speech.googleapis.com/v1/speech:recognize"

export async function POST(request: Request) {
  try {
    const { audioContent, languageCode = "en-US" } = await request.json()

    if (!audioContent) {
      return NextResponse.json({ error: "Audio content is required" }, { status: 400 })
    }

    if (!GOOGLE_CREDENTIALS) {
      return NextResponse.json({ error: "Google Cloud credentials not configured" }, { status: 500 })
    }

    // Get access token from service account
    const accessToken = await getAccessToken()

    if (!accessToken) {
      return NextResponse.json({ error: "Failed to get access token" }, { status: 500 })
    }

    // Call Google Cloud STT API
    const response = await fetch(GOOGLE_STT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        config: {
          encoding: "WEBM_OPUS",
          sampleRateHertz: 48000,
          languageCode,
          enableAutomaticPunctuation: true,
        },
        audio: {
          content: audioContent,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[Google STT] API error:", error)
      return NextResponse.json({ error: "STT recognition failed", details: error }, { status: response.status })
    }

    const data = await response.json()

    // Extract transcript from results
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

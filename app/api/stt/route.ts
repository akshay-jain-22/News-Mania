import { NextResponse } from "next/server"
import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const { audioBase64 } = await request.json()

    if (!audioBase64) {
      return NextResponse.json(
        { error: "No audio data provided" },
        { status: 400 }
      )
    }

    console.log("[v0] STT: Processing audio...")

    const GROQ_API_KEY = process.env.GROQ_API_KEY

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured" },
        { status: 500 }
      )
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, "base64")

    // Call Groq Whisper API
    const formData = new FormData()
    const audioBlob = new Blob([audioBuffer], { type: "audio/wav" })
    formData.append("file", audioBlob, "audio.wav")
    formData.append("model", "whisper-large-v3")
    formData.append("language", "en")
    formData.append("response_format", "json")

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    })

    if (!response.ok) {
      console.error("[v0] STT: Groq API error:", response.status)
      return NextResponse.json(
        { error: "Speech recognition failed" },
        { status: response.status }
      )
    }

    const result = await response.json()
    const text = result.text || ""

    console.log("[v0] STT: Transcribed text:", text)

    return NextResponse.json({ text })
  } catch (error) {
    console.error("[STT] Error:", error)
    return NextResponse.json(
      { error: "Speech-to-text processing failed" },
      { status: 500 }
    )
  }
}

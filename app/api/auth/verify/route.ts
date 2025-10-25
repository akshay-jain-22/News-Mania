import { createServerSupabaseClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "No verification token provided" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "signup",
    })

    if (error) {
      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 })
    }

    return NextResponse.json(
      {
        success: true,
        message: "Email verified successfully",
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

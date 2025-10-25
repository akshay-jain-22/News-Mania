import { createServerSupabaseClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("refreshToken")?.value

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token provided" }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (error || !data.session) {
      return NextResponse.json({ error: "Failed to refresh token" }, { status: 401 })
    }

    const response = NextResponse.json(
      {
        success: true,
        accessToken: data.session.access_token,
      },
      { status: 200 },
    )

    response.cookies.set("refreshToken", data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Refresh error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

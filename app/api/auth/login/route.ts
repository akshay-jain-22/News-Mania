import { createServerSupabaseClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    if (!data.session) {
      return NextResponse.json({ error: "Email not verified. Please check your email." }, { status: 403 })
    }

    const response = NextResponse.json(
      {
        success: true,
        accessToken: data.session.access_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name,
        },
      },
      { status: 200 },
    )

    // Set httpOnly refresh token cookie
    response.cookies.set("refreshToken", data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

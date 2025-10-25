import { createServerSupabaseClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const resetRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = resetRequestSchema.parse(body)

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
      },
    })

    if (error) {
      console.error("Password reset request error:", error)
    }

    // Always return success for security (don't reveal if email exists)
    return NextResponse.json(
      {
        success: true,
        message: "If an account exists with this email, you will receive a password reset link.",
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("Password reset request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

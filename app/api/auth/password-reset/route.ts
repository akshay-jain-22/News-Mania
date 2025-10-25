import { createServerSupabaseClient } from "@/lib/supabase"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const resetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = resetSchema.parse(body)

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "recovery",
    })

    if (error || !data.user) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(data.user.id, { password: newPassword })

    if (updateError) {
      return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
    }

    return NextResponse.json(
      {
        success: true,
        message: "Password reset successfully",
      },
      { status: 200 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    console.error("Password reset error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

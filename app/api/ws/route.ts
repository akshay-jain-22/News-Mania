import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  const auth = await verifyAuthToken(request)

  if (!auth?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json(
    {
      message: "WebSocket endpoint. Use ws:// protocol to connect.",
      userId: auth.userId,
    },
    { status: 200 },
  )
}

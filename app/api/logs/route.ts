import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { verifyAuthToken } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request)

    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const level = request.nextUrl.searchParams.get("level")
    const endpoint = request.nextUrl.searchParams.get("endpoint")
    const limit = Number.parseInt(request.nextUrl.searchParams.get("limit") || "100")

    const logs = logger.getLogs({
      level: level || undefined,
      endpoint: endpoint || undefined,
    })

    return NextResponse.json(
      {
        total: logs.length,
        logs: logs.slice(-limit),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Logs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

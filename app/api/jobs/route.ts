import { type NextRequest, NextResponse } from "next/server"
import { jobQueue } from "@/lib/job-queue"
import { verifyAuthToken } from "@/lib/auth-utils"

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request)

    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const jobId = request.nextUrl.searchParams.get("jobId")

    if (!jobId) {
      return NextResponse.json({ error: "jobId parameter is required" }, { status: 400 })
    }

    const job = jobQueue.getJob(jobId)

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    return NextResponse.json(job, { status: 200 })
  } catch (error) {
    console.error("Job status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request)

    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json({ error: "type and data are required" }, { status: 400 })
    }

    const jobId = jobQueue.enqueue(type, data)

    return NextResponse.json({ jobId, status: "queued" }, { status: 202 })
  } catch (error) {
    console.error("Job creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

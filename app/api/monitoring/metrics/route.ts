import { type NextRequest, NextResponse } from "next/server"
import { verifyAuthToken } from "@/lib/auth-utils"

interface Metrics {
  uptime: number
  requestCount: number
  errorCount: number
  averageLatency: number
  activeConnections: number
  cacheHitRate: number
  timestamp: string
}

class MetricsCollector {
  private requestCount = 0
  private errorCount = 0
  private latencies: number[] = []
  private cacheHits = 0
  private cacheMisses = 0
  private startTime = Date.now()

  recordRequest(latency: number, isError = false, cacheHit = false) {
    this.requestCount++
    if (isError) this.errorCount++
    this.latencies.push(latency)
    if (cacheHit) this.cacheHits++
    else this.cacheMisses++

    // Keep only last 1000 latencies
    if (this.latencies.length > 1000) {
      this.latencies = this.latencies.slice(-1000)
    }
  }

  getMetrics(): Metrics {
    const avgLatency = this.latencies.length > 0 ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length : 0

    return {
      uptime: Date.now() - this.startTime,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      averageLatency: Math.round(avgLatency),
      activeConnections: 0, // Would be populated from WebSocket manager
      cacheHitRate: this.cacheHits + this.cacheMisses > 0 ? this.cacheHits / (this.cacheHits + this.cacheMisses) : 0,
      timestamp: new Date().toISOString(),
    }
  }
}

export const metricsCollector = new MetricsCollector()

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuthToken(request)

    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const metrics = metricsCollector.getMetrics()

    return NextResponse.json(metrics, { status: 200 })
  } catch (error) {
    console.error("Metrics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

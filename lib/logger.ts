export interface LogEntry {
  timestamp: string
  level: "info" | "warn" | "error" | "debug"
  requestId: string
  userId?: string
  articleId?: string
  endpoint: string
  message: string
  metadata?: any
  latency?: number
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 10000

  /**
   * Log an entry
   */
  log(entry: Omit<LogEntry, "timestamp">) {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    }

    this.logs.push(logEntry)

    // Keep logs in memory (in production, send to external service)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console output for development
    console.log(`[${logEntry.level.toUpperCase()}] ${logEntry.message}`, logEntry.metadata || "")
  }

  /**
   * Get logs with optional filtering
   */
  getLogs(filter?: { level?: string; userId?: string; endpoint?: string }): LogEntry[] {
    if (!filter) return this.logs

    return this.logs.filter((log) => {
      if (filter.level && log.level !== filter.level) return false
      if (filter.userId && log.userId !== filter.userId) return false
      if (filter.endpoint && log.endpoint !== filter.endpoint) return false
      return true
    })
  }

  /**
   * Clear logs
   */
  clear() {
    this.logs = []
  }
}

export const logger = new Logger()

/**
 * Helper to generate request ID
 */
export function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

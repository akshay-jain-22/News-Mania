import type { NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

/**
 * Extract and verify JWT token from Authorization header
 */
export async function verifyAuthToken(request: NextRequest): Promise<{ userId: string } | null> {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.slice(7)
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      return null
    }

    return { userId: data.user.id }
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}

/**
 * Rate limiting helper
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(key: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count < maxRequests) {
    record.count++
    return true
  }

  return false
}

/**
 * Get rate limit info
 */
export function getRateLimitInfo(key: string, windowMs = 60000): { remaining: number; resetTime: number } {
  const record = rateLimitMap.get(key)
  const now = Date.now()

  if (!record || now > record.resetTime) {
    return { remaining: 10, resetTime: now + windowMs }
  }

  return {
    remaining: Math.max(0, 10 - record.count),
    resetTime: record.resetTime,
  }
}

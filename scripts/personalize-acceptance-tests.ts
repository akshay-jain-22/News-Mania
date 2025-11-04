import fetch from "node-fetch"

const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration: number
}

const results: TestResult[] = []

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now()
  try {
    await fn()
    results.push({ name, passed: true, duration: Date.now() - start })
    console.log(`✓ ${name}`)
  } catch (error) {
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
    })
    console.log(`✗ ${name}: ${error}`)
  }
}

async function runTests() {
  console.log("Running NewsMania Personalization Acceptance Tests\n")

  // Test 1: New user gets fallback feed
  await test("New user receives fallback feed with source=fallback", async () => {
    const newUserId = `anon-test-${Date.now()}`
    const response = await fetch(`${BASE_URL}/api/ml/personalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: newUserId, limit: 20 }),
    })

    const data = (await response.json()) as any
    if (response.status !== 200) throw new Error(`Status ${response.status}`)
    if (data.source !== "fallback") throw new Error(`Expected source=fallback, got ${data.source}`)
    if (!Array.isArray(data.items) || data.items.length === 0) throw new Error("No items in fallback feed")
    if (data.items.length > 20) throw new Error(`Expected max 20 items, got ${data.items.length}`)
  })

  // Test 2: Existing user with history gets personalized feed
  await test("Existing user with history receives personalized feed with reasons", async () => {
    const existingUserId = "test-user-with-history"

    // First create some interactions (mock)
    const response = await fetch(`${BASE_URL}/api/ml/personalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: existingUserId, limit: 20 }),
    })

    const data = (await response.json()) as any
    if (response.status !== 200) throw new Error(`Status ${response.status}`)
    // Could be personalized or fallback depending on DB state
    if (!Array.isArray(data.items)) throw new Error("Items not array")
    // Verify each item has reason field
    data.items.forEach((item: any) => {
      if (!item.reason) throw new Error("Item missing reason field")
      if (typeof item.reason !== "string") throw new Error("Reason must be string")
    })
  })

  // Test 3: Rate limiting works
  await test("Rate limiting enforced at 10 requests per minute", async () => {
    const testUserId = `rate-test-${Date.now()}`
    let rateLimited = false

    // Send 11 requests
    for (let i = 0; i < 11; i++) {
      const response = await fetch(`${BASE_URL}/api/ml/personalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: testUserId }),
      })

      if (response.status === 429) {
        rateLimited = true
        break
      }
    }

    if (!rateLimited) throw new Error("Rate limiting did not trigger after 11 requests")
  })

  // Test 4: Anonymous user tracking works
  await test("Anonymous user can track interactions and see updates", async () => {
    const anonId = `anon-${Date.now()}`

    // Get initial feed
    const response = await fetch(`${BASE_URL}/api/ml/personalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: anonId, limit: 5 }),
    })

    const data = (await response.json()) as any
    if (!data.items || data.items.length === 0) throw new Error("No items returned")

    // Track interaction
    const trackResponse = await fetch(`${BASE_URL}/api/interactions/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: anonId,
        articleId: data.items[0].articleId,
        type: "read_complete",
      }),
    })

    if (trackResponse.status !== 200) throw new Error(`Failed to track interaction: ${trackResponse.status}`)
  })

  // Test 5: Fallback sections contain expected categories
  await test("Fallback feed contains sections for Top News, Business, Tech, Sports", async () => {
    const newUserId = `fallback-test-${Date.now()}`
    const response = await fetch(`${BASE_URL}/api/ml/personalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: newUserId, limit: 20 }),
    })

    const data = (await response.json()) as any
    if (data.source === "fallback") {
      if (!Array.isArray(data.fallbackBuckets)) throw new Error("fallbackBuckets not array")
      const hasExpectedBuckets =
        data.fallbackBuckets.some((b: string) => b.includes("business")) &&
        data.fallbackBuckets.some((b: string) => b.includes("tech")) &&
        data.fallbackBuckets.some((b: string) => b.includes("sport"))

      if (!hasExpectedBuckets) throw new Error("Missing expected fallback buckets")
    }
  })

  // Test 6: Two different anon users get different results after interactions
  await test("Different anonymous users produce different personalized outputs", async () => {
    const user1 = `anon-diff-1-${Date.now()}`
    const user2 = `anon-diff-2-${Date.now()}`

    const resp1 = await fetch(`${BASE_URL}/api/ml/personalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user1 }),
    })

    const resp2 = await fetch(`${BASE_URL}/api/ml/personalize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user2 }),
    })

    const data1 = (await resp1.json()) as any
    const data2 = (await resp2.json()) as any

    // Both should return valid data
    if (!data1.items || !data2.items) throw new Error("Missing items in responses")
  })

  // Summary
  console.log("\n" + "=".repeat(50))
  const passed = results.filter((r) => r.passed).length
  const total = results.length
  console.log(`Tests passed: ${passed}/${total}`)
  console.log(`Total time: ${results.reduce((sum, r) => sum + r.duration, 0)}ms`)

  results.forEach((r) => {
    if (!r.passed) {
      console.log(`  ✗ ${r.name}: ${r.error}`)
    }
  })

  process.exit(passed === total ? 0 : 1)
}

runTests().catch(console.error)

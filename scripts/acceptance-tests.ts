/**
 * Acceptance Tests for NewsMania Hardening
 * Run with: npx ts-node scripts/acceptance-tests.ts
 */

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
    results.push({ name, passed: false, error: String(error), duration: Date.now() - start })
    console.log(`✗ ${name}: ${error}`)
  }
}

async function request(method: string, path: string, body?: any, headers?: any) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()
  return { status: response.status, data }
}

async function runTests() {
  console.log("Running NewsMania Acceptance Tests...\n")

  let accessToken = ""
  const refreshToken = ""

  // Test 1: Authentication
  await test("Auth: Signup", async () => {
    const { status, data } = await request("POST", "/api/auth/signup", {
      name: "Test User",
      email: `test-${Date.now()}@example.com`,
      password: "TestPassword123",
    })

    if (status !== 201) throw new Error(`Expected 201, got ${status}`)
    if (!data.userId) throw new Error("No userId in response")
  })

  await test("Auth: Login", async () => {
    const { status, data } = await request("POST", "/api/auth/login", {
      email: "test@example.com",
      password: "TestPassword123",
    })

    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!data.accessToken) throw new Error("No accessToken in response")

    accessToken = data.accessToken
  })

  await test("Auth: Refresh Token", async () => {
    const { status, data } = await request("POST", "/api/auth/refresh", null, {
      Cookie: `refreshToken=${refreshToken}`,
    })

    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
    if (!data.accessToken) throw new Error("No accessToken in response")
  })

  // Test 2: Summarization
  await test("ML: Summarize Article", async () => {
    const { status, data } = await request(
      "POST",
      "/api/ml/summarize",
      {
        articleId: "test-article-1",
        length: "short",
      },
      { Authorization: `Bearer ${accessToken}` },
    )

    if (status !== 200 && status !== 404) throw new Error(`Expected 200 or 404, got ${status}`)
  })

  // Test 3: Q&A
  await test("ML: Q&A", async () => {
    const { status, data } = await request(
      "POST",
      "/api/ml/qa",
      {
        articleId: "test-article-1",
        question: "What is the main topic?",
      },
      { Authorization: `Bearer ${accessToken}` },
    )

    if (status !== 200 && status !== 404) throw new Error(`Expected 200 or 404, got ${status}`)
  })

  // Test 4: Recommendations
  await test("ML: Get Recommendations", async () => {
    const { status, data } = await request(
      "POST",
      "/api/ml/recommend",
      {
        userId: "test-user-1",
        lastNInteractions: 10,
      },
      { Authorization: `Bearer ${accessToken}` },
    )

    if (status !== 200) throw new Error(`Expected 200, got ${status}`)
  })

  // Test 5: Credibility
  await test("ML: Get Credibility Score", async () => {
    const { status, data } = await request(
      "POST",
      "/api/ml/credibility",
      {
        articleId: "test-article-1",
      },
      { Authorization: `Bearer ${accessToken}` },
    )

    if (status !== 200 && status !== 404) throw new Error(`Expected 200 or 404, got ${status}`)
  })

  // Test 6: Rate Limiting
  await test("Rate Limiting: Exceed Limit", async () => {
    for (let i = 0; i < 15; i++) {
      const { status } = await request(
        "POST",
        "/api/ml/summarize",
        { articleId: "test-article-1" },
        { Authorization: `Bearer ${accessToken}` },
      )

      if (i < 10 && status === 429) throw new Error("Rate limited too early")
      if (i >= 10 && status === 429) return // Expected
    }

    throw new Error("Rate limit not enforced")
  })

  // Test 7: Health Check
  await test("Monitoring: Health Check", async () => {
    const { status, data } = await request("GET", "/api/monitoring/health")

    if (status !== 200 && status !== 503) throw new Error(`Expected 200 or 503, got ${status}`)
    if (!data.status) throw new Error("No status in response")
  })

  // Test 8: Error Handling
  await test("Error Handling: Invalid Article", async () => {
    const { status, data } = await request(
      "POST",
      "/api/ml/summarize",
      { articleId: "invalid-id" },
      { Authorization: `Bearer ${accessToken}` },
    )

    if (status !== 404) throw new Error(`Expected 404, got ${status}`)
  })

  await test("Error Handling: Unauthorized", async () => {
    const { status } = await request("POST", "/api/ml/summarize", {
      articleId: "test-article-1",
    })

    if (status !== 401) throw new Error(`Expected 401, got ${status}`)
  })

  // Print results
  console.log("\n" + "=".repeat(50))
  console.log("Test Results")
  console.log("=".repeat(50))

  const passed = results.filter((r) => r.passed).length
  const total = results.length

  results.forEach((r) => {
    const status = r.passed ? "✓" : "✗"
    console.log(`${status} ${r.name} (${r.duration}ms)`)
    if (r.error) console.log(`  Error: ${r.error}`)
  })

  console.log("\n" + "=".repeat(50))
  console.log(`Total: ${passed}/${total} tests passed`)
  console.log("=".repeat(50))

  process.exit(passed === total ? 0 : 1)
}

runTests().catch(console.error)

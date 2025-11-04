# NewsMania Personalization System

## Overview

The personalization system provides both personalized recommendations for authenticated users and intelligent fallback feeds for new or anonymous users. It uses time-decay weighted scoring, LLM-based reasoning, and interaction tracking to continuously improve recommendations.

## API Endpoints

### POST /api/ml/personalize

Generates personalized recommendations or fallback feed.

**Request:**
\`\`\`bash
curl -X POST http://localhost:3000/api/ml/personalize \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "limit": 20,
    "context": "optional context"
  }'
\`\`\`

**Response (Personalized):**
\`\`\`json
{
  "items": [
    {
      "articleId": "art-1",
      "title": "Article Title",
      "score": 0.85,
      "reason": "Matches your interest in climate policy",
      "category": "environment",
      "credibility": 85,
      "publishAt": "2025-01-15T10:00:00Z",
      "source": "NewsAPI"
    }
  ],
  "source": "personalized",
  "totalCount": 42
}
\`\`\`

**Response (Fallback):**
\`\`\`json
{
  "items": [...],
  "source": "fallback",
  "fallbackBuckets": ["top-news", "business", "tech", "sports"],
  "totalCount": 20
}
\`\`\`

### POST /api/interactions/track

Tracks user interaction (view, read, save, share, etc.).

**Request:**
\`\`\`bash
curl -X POST http://localhost:3000/api/interactions/track \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "anon-123",
    "articleId": "art-1",
    "type": "read_complete",
    "duration": 120
  }'
\`\`\`

### POST /api/ml/invalidate-cache

Invalidates cached recommendations for a user (automatic on interactions).

**Request:**
\`\`\`bash
curl -X POST http://localhost:3000/api/ml/invalidate-cache \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-123"}'
\`\`\`

## Personalization Scoring

### Formula
\`\`\`
Score = (Collab * 0.35) + (ContentSim * 0.40) + (BehaviorBoost * 0.15) + (Freshness * 0.10)
\`\`\`

- **Collaborative**: Articles similar to user's past reads
- **Content Similarity**: Category/topic matching user interests
- **Behavior Boost**: Recency decay on read completions (max 7 days)
- **Freshness**: Recent articles get priority (decay over 30 days)

### Time-Decay Formula
\`\`\`
Weight = e^(-λ·Δt)
\`\`\`
Where λ (lambda) = 0.1 (configurable) and Δt = days since interaction

## User Identification

### Authenticated Users
- Use `session.user.id` from Supabase Auth

### Anonymous Users
- Generate or retrieve `anonUserId` from localStorage
- Format: `anon-{timestamp}-{random}`
- Persists across page reloads for consistency

## Fallback Feed Composition

When user has no interaction history:

1. **Top News** (8 items): Recent, high-credibility articles
2. **Business** (4 items): Business category articles
3. **Technology** (4 items): Tech/technology articles
4. **Sports** (4 items): Sports category articles

All sections deduplicated and sorted by (credibility * 0.6) + (recency * 0.4).

## LLM Reason Generation

For personalized recommendations with confidence > 0.3, the system generates a human-readable reason using LLM:

- **Primary Provider**: OpenAI (GPT-4o)
- **Fallback Provider**: Grok
- **Fallback Strategy**: If both providers fail, uses hardcoded reason

**Example reasons:**
- "Based on your interest in climate policy"
- "Trending in technology this week"
- "Relevant to recent articles you saved"

## Rate Limiting

- **Personalize endpoint**: 10 requests per minute per user
- **Invalidate cache**: 50 requests per minute per user

## Interaction Types

| Type | Weight | Purpose |
|------|--------|---------|
| view | 1.0 | Article viewed |
| read_complete | 2.0 | Entire article read |
| save | 3.0 | Article bookmarked |
| share | 2.5 | Article shared |
| note | 2.5 | User added note |
| summarize | 1.5 | Used AI summarization |
| qa | 1.5 | Used Q&A feature |

## Frontend Integration

### Usage Example

\`\`\`tsx
import { trackInteraction } from "@/lib/interactions-service"

// Track a save
await trackInteraction({
  userId,
  articleId,
  type: "save",
  metadata: { title: "Article Title" }
})

// Load personalized feed
const response = await fetch("/api/ml/personalize", {
  method: "POST",
  body: JSON.stringify({ userId, limit: 20 })
})
\`\`\`

### Anonymous User Example

\`\`\`tsx
function getOrCreateAnonUserId() {
  const key = "anon-user-id"
  let id = localStorage.getItem(key)
  if (!id) {
    id = `anon-${Date.now()}-${Math.random().toString(36).substring(7)}`
    localStorage.setItem(key, id)
  }
  return id
}

const userId = user?.id || getOrCreateAnonUserId()
\`\`\`

## Testing

Run acceptance tests:
\`\`\`bash
npx ts-node scripts/personalize-acceptance-tests.ts
\`\`\`

Tests verify:
- New users receive fallback feed
- Existing users with history get personalized recommendations
- Rate limiting is enforced
- Interactions are tracked and persist
- Different anonymous users get different results
- All items include reason fields

## Monitoring

Check `/api/monitoring/metrics` for:
- Personalization call count
- Fallback vs personalized ratio
- Cache hit rate
- Average response time
- Provider usage (OpenAI vs Grok vs extractive)

## Environment Variables

\`\`\`env
OPENAI_API_KEY=sk-...
XAI_API_KEY=xai-...
LLM_PROVIDER=openai
SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

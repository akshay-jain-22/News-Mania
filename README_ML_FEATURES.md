# NewsMania ML Features - Implementation Guide

## Overview
This document describes the LLM-powered Summarize and Talk-to-AI features with provider-agnostic fallback, RAG-based retrieval, interaction persistence, and personalization.

## Environment Variables

\`\`\`env
# LLM Configuration
LLM_PROVIDER=openai  # openai or grok
OPENAI_API_KEY=sk_...
GROK_API_KEY=xai_...

# Time Decay
TIME_DECAY_LAMBDA=0.1  # Exponential decay rate for personalization

# Cache Invalidation
CACHE_INVALIDATION_SECRET=your-secret-key

# Database
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Vector DB
UPSTASH_VECTOR_REST_URL=https://...
UPSTASH_VECTOR_REST_TOKEN=...
\`\`\`

## API Endpoints

### POST /api/ml/summarize
Generates contextual summary with RAG and fallback support.

**Request:**
\`\`\`json
{
  "articleId": "article-123",
  "userId": "user-456",
  "length": "short|medium|long",
  "deterministic": false
}
\`\`\`

**Response:**
\`\`\`json
{
  "summary": "...",
  "modelUsed": "openai/gpt-4-turbo",
  "tokensUsed": 234,
  "sources": [{"source": "Reuters", "url": "...", "excerpt": "..."}],
  "requestId": "req_...",
  "confidence": "High|Med|Low",
  "providerFallbackUsed": false,
  "cacheHit": false
}
\`\`\`

### POST /api/ml/qa
Answers questions about article content with RAG context.

**Request:**
\`\`\`json
{
  "articleId": "article-123",
  "userId": "user-456",
  "question": "What is the main point?",
  "maxContextTokens": 2000
}
\`\`\`

### POST /api/ml/recommend
Returns personalized article recommendations.

**Request:**
\`\`\`json
{
  "userId": "user-456",
  "limit": 10,
  "context": "tech"
}
\`\`\`

**Response:**
\`\`\`json
{
  "recommendations": [
    {
      "articleId": "article-789",
      "score": 0.85,
      "reason": "Based on your interest in technology"
    }
  ],
  "cacheHit": false,
  "lastUpdated": "2024-01-15T10:30:00Z"
}
\`\`\`

### POST /api/interactions/track
Records user interactions for personalization.

**Request:**
\`\`\`json
{
  "articleId": "article-123",
  "action": "view|read_complete|save|share|summarize|qa",
  "durationSeconds": 45,
  "question": "What happened?",
  "resultRequestId": "req_..."
}
\`\`\`

### POST /api/cache/invalidate
Invalidates cached results when content changes.

**Request:**
\`\`\`bash
Authorization: Bearer {CACHE_INVALIDATION_SECRET}

{
  "articleId": "article-123",
  "type": "summarize|qa|recommendations",
  "userId": "user-456"
}
\`\`\`

## Database Schema

### interactions
- `id`: UUID
- `user_id`: UUID
- `article_id`: string
- `action`: enum(view, read_complete, save, share, summarize, qa)
- `duration_seconds`: integer
- `question`: text
- `request_id`: string
- `model_used`: string
- `provider_used`: string
- `tokens_used`: integer
- `created_at`: timestamp

### summarization_cache
- `cache_key`: string (unique)
- `article_id`: string
- `summary`: text
- `model_used`: string
- `tokens_used`: integer
- `sources`: jsonb
- `request_id`: string
- `confidence`: enum(High, Med, Low)
- `provider_fallback_used`: boolean
- `created_at`: timestamp
- `expires_at`: timestamp (TTL: 24h)

### qa_cache
- `cache_key`: string (unique)
- `article_id`: string
- `question`: text
- `answer`: text
- `model_used`: string
- `tokens_used`: integer
- `sources`: jsonb
- `request_id`: string
- `confidence`: enum(High, Med, Low)
- `provider_fallback_used`: boolean
- `created_at`: timestamp
- `expires_at`: timestamp (TTL: 24h)

### recommendations_cache
- `user_id`: UUID
- `cache_key`: string
- `recommendations`: jsonb
- `last_updated_at`: timestamp
- `expires_at`: timestamp (TTL: 1h)

## Fallback Logic

1. **Primary Provider**: Attempt summarization/QA with configured provider (default: OpenAI)
2. **Retry Logic**: If 5xx error, timeout, rate-limit, or generic failure, retry once with fallback provider
3. **Extractive Fallback**: If both providers fail, use TextRank-based extractive summarization from passage context
4. **Response**: All responses include `providerFallbackUsed` flag and `modelUsed` metadata

## Personalization

### Time Decay
Contributions decay exponentially: `contribution *= e^(-λ·Δt)` where Δt is days since interaction and λ is configurable.

### Interaction Weights
- view: 1.0
- read_complete: 2.0
- save: 3.0
- share: 2.5
- summarize: 1.5
- qa: 1.5

### Recommendation Scoring
- Primary: Category preference from interaction history
- Secondary: Source reputation and freshness
- Diversity: Penalty applied to avoid repetitive suggestions

## Monitoring

### Health Check
\`\`\`bash
curl http://localhost:3000/api/monitoring/health
\`\`\`

### Metrics
\`\`\`bash
curl http://localhost:3000/api/monitoring/metrics
\`\`\`

Returns:
- `requestsLast24h`: Total requests
- `averageTokensPerRequest`: Avg tokens used
- `fallbackRate`: % of requests using fallback provider
- `cacheHitRate`: % of cache hits
- `topAction`: Most common action type

## Testing

Run acceptance tests:
\`\`\`bash
npx ts-node scripts/acceptance-tests.ts
\`\`\`

Tests cover:
- Fallback behavior
- No generic error messages
- Interaction persistence
- Personalization updates
- Cache invalidation
- Rate limiting
- Health checks
- Metrics collection

## cURL Examples

### Test Summarization
\`\`\`bash
curl -X POST http://localhost:3000/api/ml/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "articleId": "article-1",
    "userId": "user-1",
    "length": "medium"
  }'
\`\`\`

### Test Q&A
\`\`\`bash
curl -X POST http://localhost:3000/api/ml/qa \
  -H "Content-Type: application/json" \
  -d '{
    "articleId": "article-1",
    "userId": "user-1",
    "question": "What is the main topic?"
  }'
\`\`\`

### Test Personalized Recommendations
\`\`\`bash
curl -X POST http://localhost:3000/api/ml/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "limit": 10
  }'
\`\`\`

### Track Interaction
\`\`\`bash
curl -X POST http://localhost:3000/api/interactions/track \
  -H "Content-Type: application/json" \
  -d '{
    "articleId": "article-1",
    "action": "read_complete",
    "durationSeconds": 120
  }'

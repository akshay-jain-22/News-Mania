# NewsMania - Hardened News Platform

A production-ready news platform with secure authentication, RAG-powered AI features, real-time updates, voice assistant, and comprehensive monitoring.

## Features

- **Secure Authentication**: JWT-based auth with refresh tokens, email verification, password reset
- **RAG Pipeline**: Vector DB integration for context-aware summarization and Q&A
- **Real-time Updates**: WebSocket support for live recommendation and credibility updates
- **ML Endpoints**: Hybrid recommendation engine and credibility scoring
- **Voice Assistant**: AI-powered voice agent with speech recognition and text-to-speech
- **Google Cloud AI**: Integrated Gemini AI, Speech-to-Text, and Text-to-Speech
- **Background Workers**: Job queue for async processing
- **Monitoring**: Health checks, metrics, logging, and rate-limiting

## Environment Variables

\`\`\`bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Database
POSTGRES_URL=your_postgres_url
POSTGRES_PRISMA_URL=your_postgres_prisma_url
POSTGRES_URL_NON_POOLING=your_postgres_url_non_pooling
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DATABASE=your_postgres_database
POSTGRES_HOST=your_postgres_host

# Vector DB (Upstash)
UPSTASH_VECTOR_REST_URL=your_upstash_url
UPSTASH_VECTOR_REST_TOKEN=your_upstash_token
UPSTASH_VECTOR_REST_READONLY_TOKEN=your_upstash_readonly_token

# AI APIs
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key
XAI_API_KEY=your_xai_key

# Google Cloud AI (Primary AI Provider)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"...","private_key":"..."}

# News API
NEWS_API_KEY=your_news_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
\`\`\`

**See [GOOGLE_CLOUD_SETUP.md](./GOOGLE_CLOUD_SETUP.md) for detailed Google Cloud configuration instructions.**

## API Endpoints

### Authentication

\`\`\`bash
# Sign up
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePassword123"
  }'

# Refresh token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Cookie: refreshToken=your_refresh_token"

# Verify email
curl -X GET "http://localhost:3000/api/auth/verify?token=verification_token"

# Password reset request
curl -X POST http://localhost:3000/api/auth/password-reset-request \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'

# Password reset
curl -X POST http://localhost:3000/api/auth/password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset_token",
    "newPassword": "NewPassword123"
  }'
\`\`\`

### ML Endpoints

\`\`\`bash
# Summarize article
curl -X POST http://localhost:3000/api/ml/summarize \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "articleId": "article-123",
    "length": "medium",
    "deterministic": false
  }'

# Ask question about article
curl -X POST http://localhost:3000/api/ml/qa \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "articleId": "article-123",
    "question": "What are the main points?"
  }'

# Get recommendations
curl -X POST http://localhost:3000/api/ml/recommend \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "lastNInteractions": 10
  }'

# Get credibility score
curl -X POST http://localhost:3000/api/ml/credibility \
  -H "Authorization: Bearer your_access_token" \
  -H "Content-Type: application/json" \
  -d '{"articleId": "article-123"}'
\`\`\`

### Voice Assistant

\`\`\`bash
# Send message to voice agent
curl -X POST http://localhost:3000/api/voice-agent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Search for latest technology news",
    "conversationHistory": []
  }'

# Google Cloud Text-to-Speech
curl -X POST http://localhost:3000/api/google-tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, this is a test",
    "languageCode": "en-US",
    "voiceName": "en-US-Neural2-F"
  }'

# Google Cloud Speech-to-Text
curl -X POST http://localhost:3000/api/google-stt \
  -H "Content-Type: application/json" \
  -d '{
    "audioContent": "base64_encoded_audio",
    "languageCode": "en-US"
  }'
\`\`\`

### Monitoring

\`\`\`bash
# Health check
curl http://localhost:3000/api/monitoring/health

# Get metrics
curl -X GET http://localhost:3000/api/monitoring/metrics \
  -H "Authorization: Bearer your_access_token"

# Get logs
curl -X GET "http://localhost:3000/api/logs?level=error&limit=50" \
  -H "Authorization: Bearer your_access_token"

# Get job status
curl -X GET "http://localhost:3000/api/jobs?jobId=job-123" \
  -H "Authorization: Bearer your_access_token"
\`\`\`

## Acceptance Tests

### 1. Authentication Flow

\`\`\`bash
# Sign up
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "TestPassword123"
  }')

echo "Signup response: $SIGNUP_RESPONSE"

# Login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123"
  }')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
echo "Access token: $ACCESS_TOKEN"

# Refresh token
REFRESH_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/refresh \
  -H "Cookie: refreshToken=$(echo $LOGIN_RESPONSE | grep -o 'refreshToken=[^;]*' | cut -d'=' -f2)")

echo "Refresh response: $REFRESH_RESPONSE"
\`\`\`

### 2. Summarization & QA

\`\`\`bash
# Test summarization with 5 different articles
for i in {1..5}; do
  SUMMARY=$(curl -s -X POST http://localhost:3000/api/ml/summarize \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"articleId\": \"article-$i\",
      \"length\": \"short\"
    }")
  
  echo "Summary $i: $SUMMARY"
done

# Test Q&A with multiple questions
curl -s -X POST http://localhost:3000/api/ml/qa \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "articleId": "article-1",
    "question": "What is the main topic?"
  }' > qa_response_1.json

curl -s -X POST http://localhost:3000/api/ml/qa \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "articleId": "article-1",
    "question": "Who are the key people mentioned?"
  }' > qa_response_2.json

echo "Q&A responses saved to qa_response_*.json"
\`\`\`

### 3. Real-time Updates

\`\`\`bash
# Monitor WebSocket connection and updates
wscat -c "ws://localhost:3000/api/ws" \
  --execute 'send {"type":"auth","token":"your_access_token"}'
\`\`\`

### 4. Rate Limiting

\`\`\`bash
# Exceed rate limit
for i in {1..15}; do
  curl -s -X POST http://localhost:3000/api/ml/summarize \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"articleId": "article-1"}' | grep -o '"error":"[^"]*'
done
\`\`\`

### 5. Error Handling

\`\`\`bash
# Test with invalid article
curl -s -X POST http://localhost:3000/api/ml/summarize \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"articleId": "invalid-id"}' | grep -o '"error":"[^"]*'

# Test without auth
curl -s -X POST http://localhost:3000/api/ml/summarize \
  -H "Content-Type: application/json" \
  -d '{"articleId": "article-1"}' | grep -o '"error":"[^"]*'
\`\`\`

## Database Schema

Required tables:

\`\`\`sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Articles
CREATE TABLE articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source TEXT,
  content TEXT,
  description TEXT,
  published_at TIMESTAMP,
  credibility_score FLOAT,
  category TEXT,
  view_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  comment_count INT DEFAULT 0
);

-- Interactions
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  article_id TEXT REFERENCES articles(id),
  action TEXT,
  duration INT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Caches
CREATE TABLE summarization_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE,
  article_id TEXT,
  summary TEXT,
  model_used TEXT,
  tokens_used INT,
  sources JSONB,
  request_id TEXT,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE TABLE qa_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE,
  article_id TEXT,
  question TEXT,
  answer TEXT,
  model_used TEXT,
  tokens_used INT,
  sources JSONB,
  request_id TEXT,
  created_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE TABLE credibility_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id TEXT UNIQUE,
  score INT,
  factors JSONB,
  explanation TEXT,
  updated_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE TABLE recommendations_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  recommendations JSONB,
  updated_at TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE TABLE ml_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  request_type TEXT,
  article_id TEXT,
  model_used TEXT,
  tokens_used INT,
  created_at TIMESTAMP
);
\`\`\`

## Google Cloud Integration

This platform uses Google Cloud services for AI features:

### Gemini AI
- Article summarization (all styles)
- Fact-checking and credibility assessment
- Personalized recommendation reasoning
- Voice assistant chat responses
- News context understanding

### Speech-to-Text
- High-quality voice recognition
- Better accuracy than browser Web Speech API
- Supports multiple languages and accents

### Text-to-Speech
- Natural-sounding voice responses
- Multiple voice options (Neural2, Wavenet, Standard)
- Customizable pitch, rate, and volume

### Fallback Strategy

The system includes graceful fallbacks:
1. **Gemini AI** → Groq → OpenAI → Text extraction
2. **Speech-to-Text** → Browser Web Speech API
3. **Text-to-Speech** → Browser SpeechSynthesis API

This ensures continuous operation even if Google Cloud credentials are not configured.

### Setup Instructions

1. Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a service account in [Google Cloud Console](https://console.cloud.google.com/)
3. Enable required APIs:
   - Cloud Text-to-Speech API
   - Cloud Speech-to-Text API  
   - Generative Language API (Gemini)
4. Download service account JSON key
5. Add to environment variables (see [GOOGLE_CLOUD_SETUP.md](./GOOGLE_CLOUD_SETUP.md))

## Deployment

1. Set all environment variables in your deployment platform
2. Run database migrations to create required tables
3. Deploy to Vercel or your preferred platform
4. Monitor health endpoint: `GET /api/monitoring/health`
5. Check metrics: `GET /api/monitoring/metrics`

## Voice Assistant Features

The voice assistant provides:
- **Voice Input**: Speak naturally or type questions
- **Intent Detection**: Automatically understands search, navigation, summarization requests
- **Context Awareness**: Remembers conversation history
- **Voice Output**: Natural-sounding responses
- **Graceful Fallback**: Switches to text mode if voice recognition fails
- **Multi-modal**: Supports both voice and text input simultaneously

Access the voice assistant via the floating microphone button on any page.

## Support

For issues or questions:
- **Google Cloud Setup**: See [GOOGLE_CLOUD_SETUP.md](./GOOGLE_CLOUD_SETUP.md)
- **General Issues**: Open a GitHub issue
- **Voice Features**: Check browser console for "[Google Cloud]" or "[Voice Agent]" logs
- **Development Team**: Contact via GitHub

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Frontend**: React 19, Tailwind CSS, shadcn/ui
- **AI**: Google Gemini (primary), Groq, OpenAI (fallbacks)
- **Voice**: Google Cloud Speech APIs
- **Database**: Supabase (PostgreSQL)
- **Vector DB**: Upstash Vector
- **Real-time**: WebSockets
- **Deployment**: Vercel

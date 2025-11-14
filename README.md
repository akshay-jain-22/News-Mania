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
# Send message to assistant (supports both voice and text input)
curl -X POST http://localhost:3000/api/assistant \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Search for latest technology news",
    "sessionId": "session_123",
    "anonId": "anon_456",
    "conversationHistory": []
  }'

# Create voice assistant session
curl -X POST http://localhost:3000/api/assistant/session \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_123",
    "anonId": "anon_456",
    "mode": "push_to_talk",
    "contextType": "article",
    "contextId": "article-123"
  }'

# Log conversation turn
curl -X POST http://localhost:3000/api/assistant/log \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session_123",
    "anonId": "anon_456",
    "direction": "user",
    "text": "What are today\'s top stories?",
    "latency": 850
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

-- Voice Assistant Tables
CREATE TABLE assistant_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  anon_id TEXT,
  context_type TEXT,
  context_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE,
  mode TEXT DEFAULT 'push_to_talk',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE assistant_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  anon_id TEXT,
  direction TEXT NOT NULL,
  text TEXT NOT NULL,
  provider TEXT DEFAULT 'gemini',
  intent TEXT,
  latency_ms INTEGER,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_assistant_sessions_session_id ON assistant_sessions(session_id);
CREATE INDEX idx_assistant_logs_session_id ON assistant_logs(session_id);
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

The Newsurf voice assistant provides comprehensive two-way conversational interactions with three distinct modes:

### Three Conversation Modes

1. **Push-to-Talk** (Default)
   - Press and hold the microphone button to speak
   - Release to process your speech
   - Best for controlled, intentional interactions

2. **Continuous Conversation**
   - Always listening mode with automatic turn-taking
   - Uses silence detection (1.2s timeout) to detect turn ends
   - Natural back-and-forth conversation without button presses

3. **Assistant-Initiated "Talk to Me"**
   - Assistant proactively speaks a starter prompt
   - Automatically switches to listening after speaking
   - Great for getting daily briefings or starting conversations

### Capabilities

- **Voice Input**: Speak naturally using browser Web Speech API
- **Intent Detection**: Automatically understands search, navigation, summarization, fact-checking requests
- **Context Awareness**: Understands current article, topic, or personalized feed context
- **Voice Output**: Natural-sounding responses using Speech Synthesis API
- **Interruption Handling**: Speak during assistant response to interrupt and take control
- **Conversation Logging**: All turns stored in Supabase with session tracking
- **Graceful Fallback**: Automatically switches to text input if voice recognition fails

### Usage

1. Click the floating microphone button in the bottom-right corner
2. Choose your preferred mode from the tabs
3. Speak your request (or type if voice is unavailable)
4. Listen to the assistant's spoken response

## Support

For issues or questions:
- **Voice Assistant**: See [VOICE_ASSISTANT_README.md](./VOICE_ASSISTANT_README.md) for detailed documentation
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

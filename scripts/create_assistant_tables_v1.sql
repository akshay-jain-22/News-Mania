-- Create assistant_sessions table for tracking conversation sessions
CREATE TABLE IF NOT EXISTS assistant_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  anon_id TEXT,
  context_type TEXT, -- 'article', 'personalized_feed', 'topic', 'general'
  context_id TEXT, -- article_id, topic_name, etc.
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE,
  mode TEXT DEFAULT 'push_to_talk', -- 'push_to_talk', 'continuous', 'assistant_initiated'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assistant_logs table for storing all conversation turns
CREATE TABLE IF NOT EXISTS assistant_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  anon_id TEXT,
  direction TEXT NOT NULL, -- 'user' or 'assistant'
  text TEXT NOT NULL,
  provider TEXT DEFAULT 'gemini',
  intent TEXT,
  latency_ms INTEGER,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assistant_sessions_user_id ON assistant_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_sessions_anon_id ON assistant_sessions(anon_id);
CREATE INDEX IF NOT EXISTS idx_assistant_sessions_session_id ON assistant_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_assistant_sessions_active ON assistant_sessions(active);
CREATE INDEX IF NOT EXISTS idx_assistant_logs_session_id ON assistant_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_assistant_logs_user_id ON assistant_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_assistant_logs_created_at ON assistant_logs(created_at);

-- Enable RLS
ALTER TABLE assistant_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assistant_sessions
CREATE POLICY "Users can view their own sessions"
  ON assistant_sessions FOR SELECT
  USING (auth.uid() = user_id OR (auth.uid() IS NULL AND anon_id IS NOT NULL));

CREATE POLICY "Users can insert their own sessions"
  ON assistant_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND anon_id IS NOT NULL));

CREATE POLICY "Users can update their own sessions"
  ON assistant_sessions FOR UPDATE
  USING (auth.uid() = user_id OR (auth.uid() IS NULL AND anon_id IS NOT NULL));

-- RLS Policies for assistant_logs
CREATE POLICY "Users can view their own logs"
  ON assistant_logs FOR SELECT
  USING (auth.uid() = user_id OR (auth.uid() IS NULL AND anon_id IS NOT NULL));

CREATE POLICY "Users can insert their own logs"
  ON assistant_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND anon_id IS NOT NULL));

-- Allow anonymous access (for logged-out users)
CREATE POLICY "Allow anonymous inserts to sessions"
  ON assistant_sessions FOR INSERT
  WITH CHECK (anon_id IS NOT NULL);

CREATE POLICY "Allow anonymous inserts to logs"
  ON assistant_logs FOR INSERT
  WITH CHECK (anon_id IS NOT NULL);

-- Create interactions table for tracking user behavior
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('view', 'read_complete', 'save', 'share', 'summarize', 'qa')),
  duration_seconds INTEGER,
  question TEXT,
  result_request_id TEXT,
  model_used TEXT,
  provider_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_article_id ON interactions(article_id);
CREATE INDEX idx_interactions_action ON interactions(action);
CREATE INDEX idx_interactions_created_at ON interactions(created_at DESC);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_categories TEXT[] DEFAULT '{}',
  preferred_sources TEXT[] DEFAULT '{}',
  time_decay_lambda FLOAT DEFAULT 0.1,
  diversity_penalty FLOAT DEFAULT 0.15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Create recommendations cache table
CREATE TABLE IF NOT EXISTS recommendations_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendations JSONB NOT NULL,
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recommendations_cache_user_id ON recommendations_cache(user_id);
CREATE INDEX idx_recommendations_cache_expires_at ON recommendations_cache(expires_at);

-- Create interaction embeddings table for personalization
CREATE TABLE IF NOT EXISTS interaction_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  embedding VECTOR(1536),
  interaction_weight FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_interaction_embeddings_user_id ON interaction_embeddings(user_id);
CREATE INDEX idx_interaction_embeddings_article_id ON interaction_embeddings(article_id);

-- Enable Row Level Security
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE interaction_embeddings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own interactions" ON interactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" ON interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own recommendations" ON recommendations_cache
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendations" ON recommendations_cache
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own embeddings" ON interaction_embeddings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own embeddings" ON interaction_embeddings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

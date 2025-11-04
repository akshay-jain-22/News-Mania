-- Additional tables for personalization fallback support

-- article_metadata: canonical articles store with tags as array
CREATE TABLE IF NOT EXISTS public.article_metadata (
  id text PRIMARY KEY,
  title text NOT NULL,
  source text,
  category text,
  tags text[] DEFAULT '{}',
  thumb_url text,
  snippet text,
  content text,
  credibility_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_article_metadata_category ON public.article_metadata(category);
CREATE INDEX IF NOT EXISTS idx_article_metadata_tags ON public.article_metadata USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_article_metadata_created_at ON public.article_metadata (created_at DESC);

-- fallback_news: preloaded fallback feed
CREATE TABLE IF NOT EXISTS public.fallback_news (
  id text PRIMARY KEY,
  title text NOT NULL,
  category text,
  thumb_url text,
  snippet text,
  source text,
  credibility_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fallback_news_category ON public.fallback_news(category);
CREATE INDEX IF NOT EXISTS idx_fallback_news_created_at ON public.fallback_news(created_at DESC);

-- service_logs: error tracking for debugging
CREATE TABLE IF NOT EXISTS public.service_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text,
  endpoint text,
  error text,
  fallback_used boolean DEFAULT FALSE,
  provider text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_logs_user_id ON public.service_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_service_logs_endpoint ON public.service_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_service_logs_created_at ON public.service_logs(created_at DESC);

-- Disable RLS for these tables to allow anon access
ALTER TABLE public.article_metadata DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fallback_news DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_logs DISABLE ROW LEVEL SECURITY;

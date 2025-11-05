-- Create user stats table to store aggregated user statistics
CREATE TABLE IF NOT EXISTS public.user_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  articles_read integer DEFAULT 0,
  time_spent_seconds integer DEFAULT 0,
  reading_streak integer DEFAULT 0,
  last_read_date date,
  top_category text,
  top_categories jsonb DEFAULT '[]'::jsonb,
  category_breakdown jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own stats
CREATE POLICY "Users can view their own stats" ON public.user_stats
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: Service role can manage stats
CREATE POLICY "Service role manages stats" ON public.user_stats
  FOR ALL USING (auth.role() = 'service_role');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON public.user_stats(user_id);

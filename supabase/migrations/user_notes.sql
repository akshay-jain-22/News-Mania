-- Migration for user_notes table
-- This file ensures the user_notes table is properly set up

-- Drop existing table if it exists (for clean migration)
DROP TABLE IF EXISTS user_notes CASCADE;

-- Create the user_notes table with proper structure
CREATE TABLE user_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  topic TEXT DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  article_id TEXT,
  article_title TEXT,
  article_url TEXT,
  is_markdown BOOLEAN DEFAULT FALSE,
  tags JSONB DEFAULT '[]'::jsonb
);

-- Create indexes for better performance
CREATE INDEX idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX idx_user_notes_article_id ON user_notes(article_id);
CREATE INDEX idx_user_notes_created_at ON user_notes(created_at DESC);
CREATE INDEX idx_user_notes_topic ON user_notes(topic);

-- Add RLS (Row Level Security) policies
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notes
CREATE POLICY "Users can view own notes" ON user_notes
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own notes
CREATE POLICY "Users can insert own notes" ON user_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own notes
CREATE POLICY "Users can update own notes" ON user_notes
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own notes
CREATE POLICY "Users can delete own notes" ON user_notes
  FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_notes_updated_at 
  BEFORE UPDATE ON user_notes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

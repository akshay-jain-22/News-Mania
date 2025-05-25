-- Create user_notes table
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_markdown BOOLEAN DEFAULT FALSE,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_article_id ON user_notes(article_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_tags ON user_notes USING GIN(tags);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_user_notes_updated_at
BEFORE UPDATE ON user_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for user_notes
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notes
CREATE POLICY "Users can select their own notes"
ON user_notes
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can only insert their own notes
CREATE POLICY "Users can insert their own notes"
ON user_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own notes
CREATE POLICY "Users can update their own notes"
ON user_notes
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can only delete their own notes
CREATE POLICY "Users can delete their own notes"
ON user_notes
FOR DELETE
USING (auth.uid() = user_id);

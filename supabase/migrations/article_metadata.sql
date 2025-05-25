-- Create article_metadata table
CREATE TABLE IF NOT EXISTS article_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id TEXT NOT NULL UNIQUE,
  summary TEXT,
  tags JSONB DEFAULT '[]',
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on article_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_article_metadata_article_id ON article_metadata(article_id);

-- Create index on tags for faster tag-based queries
CREATE INDEX IF NOT EXISTS idx_article_metadata_tags ON article_metadata USING GIN(tags);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_article_metadata_updated_at
BEFORE UPDATE ON article_metadata
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

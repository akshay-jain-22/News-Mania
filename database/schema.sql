-- User Credentials Table
CREATE TABLE IF NOT EXISTS user_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    age INTEGER NOT NULL,
    profession VARCHAR(100) NOT NULL,
    gender VARCHAR(50) NOT NULL,
    country VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    city VARCHAR(100),
    timezone VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    interests TEXT[], -- Array of interests
    languages TEXT[], -- Array of language codes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Behaviors Table (for tracking interactions)
CREATE TABLE IF NOT EXISTS user_behaviors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    article_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'view', 'click', 'read', 'share', 'save', 'skip', 'like', 'dislike'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_of_day INTEGER NOT NULL, -- 0-23 hours
    day_of_week INTEGER NOT NULL, -- 0-6 (Sunday = 0)
    read_duration INTEGER DEFAULT 0, -- seconds
    scroll_depth DECIMAL(3, 2) DEFAULT 0, -- 0-1 percentage
    device_type VARCHAR(20) NOT NULL, -- 'mobile', 'desktop', 'tablet'
    source VARCHAR(50) NOT NULL, -- 'recommendation', 'search', 'trending', 'category'
    category VARCHAR(50) NOT NULL,
    sentiment_reaction VARCHAR(20), -- 'positive', 'negative', 'neutral'
    
    -- Indexes for performance
    INDEX idx_user_behaviors_user_id (user_id),
    INDEX idx_user_behaviors_timestamp (timestamp),
    INDEX idx_user_behaviors_category (category),
    INDEX idx_user_behaviors_action (action)
);

-- User Preferences Table (for storing learned preferences)
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    category_weights JSONB NOT NULL DEFAULT '{}', -- Category preference weights
    time_based_preferences JSONB NOT NULL DEFAULT '{}', -- Hour-based category preferences
    source_preferences JSONB NOT NULL DEFAULT '{}', -- Source reliability preferences
    content_length_preference VARCHAR(20) DEFAULT 'medium', -- 'short', 'medium', 'long', 'mixed'
    update_frequency VARCHAR(20) DEFAULT 'hourly', -- 'real_time', 'hourly', 'daily'
    language_preferences TEXT[] DEFAULT ARRAY['en'],
    location_relevance DECIMAL(3, 2) DEFAULT 0.5, -- 0-1, importance of local news
    recency_preference DECIMAL(3, 2) DEFAULT 0.6, -- 0-1, preference for recent news
    diversity_factor DECIMAL(3, 2) DEFAULT 0.6, -- 0-1, variety in recommendations
    confidence_score DECIMAL(3, 2) DEFAULT 0.3, -- 0-1, confidence in preferences
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES user_credentials(id) ON DELETE CASCADE
);

-- News Articles Table (for storing article metadata)
CREATE TABLE IF NOT EXISTS news_articles (
    id VARCHAR(255) PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    url TEXT NOT NULL,
    url_to_image TEXT,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    source_id VARCHAR(100),
    source_name VARCHAR(255) NOT NULL,
    source_reliability_score DECIMAL(3, 2) DEFAULT 0.7,
    author VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    location_country VARCHAR(100),
    location_state VARCHAR(100),
    location_city VARCHAR(100),
    global_relevance DECIMAL(3, 2) DEFAULT 0.5,
    sentiment VARCHAR(20) DEFAULT 'neutral', -- 'positive', 'negative', 'neutral'
    complexity_score DECIMAL(3, 2) DEFAULT 0.5, -- 0-1, reading difficulty
    estimated_read_time INTEGER DEFAULT 5, -- minutes
    keywords TEXT[], -- Array of keywords
    entities TEXT[], -- Array of entities (people, organizations, locations)
    trending_score DECIMAL(3, 2) DEFAULT 0.0, -- 0-1
    credibility_score DECIMAL(3, 2) DEFAULT 0.7, -- 0-1
    views_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    embedding_vector VECTOR(384), -- For similarity calculations (if using pgvector)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance
    INDEX idx_news_articles_category (category),
    INDEX idx_news_articles_published_at (published_at),
    INDEX idx_news_articles_trending_score (trending_score),
    INDEX idx_news_articles_location_country (location_country)
);

-- User Segments Table (for demographic clustering)
CREATE TABLE IF NOT EXISTS user_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL, -- Segmentation criteria
    typical_preferences JSONB NOT NULL, -- Typical preferences for this segment
    size INTEGER DEFAULT 0, -- Number of users in segment
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A/B Test Configurations Table
CREATE TABLE IF NOT EXISTS ab_test_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_groups JSONB NOT NULL, -- Test group configurations
    duration_days INTEGER NOT NULL,
    metrics TEXT[], -- Metrics to track
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'paused'
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    results JSONB, -- Test results when completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendation Logs Table (for tracking recommendation performance)
CREATE TABLE IF NOT EXISTS recommendation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    article_id VARCHAR(255) NOT NULL,
    recommendation_score DECIMAL(5, 4) NOT NULL,
    pipeline_used VARCHAR(50) NOT NULL, -- 'cold_start', 'behavioral', 'hybrid'
    reasoning JSONB NOT NULL, -- Detailed reasoning scores
    position_in_list INTEGER NOT NULL, -- Position in recommendation list
    was_clicked BOOLEAN DEFAULT FALSE,
    was_read BOOLEAN DEFAULT FALSE,
    read_duration INTEGER DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes for performance analysis
    INDEX idx_recommendation_logs_user_id (user_id),
    INDEX idx_recommendation_logs_timestamp (timestamp),
    INDEX idx_recommendation_logs_pipeline_used (pipeline_used)
);

-- Global Analytics Table (for system-wide metrics)
CREATE TABLE IF NOT EXISTS global_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_users INTEGER DEFAULT 0,
    total_behaviors INTEGER DEFAULT 0,
    category_distribution JSONB DEFAULT '{}',
    device_distribution JSONB DEFAULT '{}',
    hourly_activity JSONB DEFAULT '{}',
    average_engagement DECIMAL(5, 2) DEFAULT 0,
    recommendation_performance JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate daily records
    UNIQUE(date)
);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_user_credentials_updated_at BEFORE UPDATE ON user_credentials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_news_articles_updated_at BEFORE UPDATE ON news_articles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_segments_updated_at BEFORE UPDATE ON user_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data insertion for testing
INSERT INTO user_segments (name, description, criteria, typical_preferences) VALUES
('Young Professionals', 'Tech-savvy professionals aged 25-35', 
 '{"age_range": [25, 35], "professions": ["software_engineer", "business_analyst", "consultant"]}',
 '{"category_weights": {"technology": 0.8, "business": 0.7, "politics": 0.5}, "diversity_factor": 0.6}'),
('Senior Executives', 'Business leaders and executives aged 40+',
 '{"age_range": [40, 65], "professions": ["ceo", "director", "manager", "executive"]}',
 '{"category_weights": {"business": 0.9, "politics": 0.8, "technology": 0.6}, "diversity_factor": 0.4}'),
('Students', 'University and graduate students',
 '{"age_range": [18, 28], "professions": ["student"]}',
 '{"category_weights": {"technology": 0.7, "entertainment": 0.8, "sports": 0.6}, "diversity_factor": 0.8}');

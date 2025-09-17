-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    age INTEGER,
    profession VARCHAR(100),
    gender VARCHAR(50),
    location JSONB,
    preferences JSONB,
    engagement_score DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User category preferences table
CREATE TABLE IF NOT EXISTS user_category_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    score DECIMAL(5,4) DEFAULT 0.0,
    confidence DECIMAL(3,2) DEFAULT 0.0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, category)
);

-- User time-based preferences table
CREATE TABLE IF NOT EXISTS user_time_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    time_slot VARCHAR(10) NOT NULL, -- '00-06', '06-12', '12-18', '18-24'
    categories TEXT[] DEFAULT '{}',
    avg_read_time INTEGER DEFAULT 0,
    engagement_score DECIMAL(3,2) DEFAULT 0.0,
    UNIQUE(user_id, time_slot)
);

-- User interactions table
CREATE TABLE IF NOT EXISTS user_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    article_id VARCHAR(255) NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'view', 'click', 'share', 'save', 'skip'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_time INTEGER, -- in seconds
    category VARCHAR(50),
    time_of_day VARCHAR(10),
    device_type VARCHAR(20),
    session_id VARCHAR(100)
);

-- Articles table for caching and analysis
CREATE TABLE IF NOT EXISTS articles (
    id VARCHAR(255) PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    category VARCHAR(50),
    subcategory VARCHAR(50),
    source VARCHAR(100),
    published_at TIMESTAMP WITH TIME ZONE,
    location VARCHAR(100),
    complexity DECIMAL(3,2),
    sentiment DECIMAL(3,2),
    keywords TEXT[],
    reading_time INTEGER,
    image_url TEXT,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendation logs for A/B testing and analysis
CREATE TABLE IF NOT EXISTS recommendation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    article_id VARCHAR(255),
    recommendation_score DECIMAL(5,4),
    pipeline VARCHAR(50),
    reasons TEXT[],
    confidence DECIMAL(3,2),
    test_variant VARCHAR(50),
    test_id VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User feedback table
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    article_id VARCHAR(255),
    feedback_type VARCHAR(20), -- 'like', 'dislike', 'not_interested', 'report'
    feedback_value INTEGER, -- 1-5 rating or binary
    comment TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Behavioral patterns table for ML training
CREATE TABLE IF NOT EXISTS behavioral_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    pattern_type VARCHAR(50), -- 'time_based', 'category_shift', 'engagement_change'
    pattern_data JSONB,
    confidence DECIMAL(3,2),
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interactions_timestamp ON user_interactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_interactions_category ON user_interactions(category);
CREATE INDEX IF NOT EXISTS idx_user_interactions_action ON user_interactions(action);

CREATE INDEX IF NOT EXISTS idx_user_category_preferences_user_id ON user_category_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_category_preferences_category ON user_category_preferences(category);

CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);

CREATE INDEX IF NOT EXISTS idx_recommendation_logs_user_id ON recommendation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_timestamp ON recommendation_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_test_variant ON recommendation_logs(test_variant);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for calculating engagement scores
CREATE OR REPLACE FUNCTION calculate_user_engagement_score(user_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    engagement_score DECIMAL(3,2);
BEGIN
    SELECT 
        COALESCE(
            (
                SUM(
                    CASE 
                        WHEN action = 'view' THEN 1
                        WHEN action = 'click' THEN 2
                        WHEN action = 'share' THEN 4
                        WHEN action = 'save' THEN 3
                        WHEN action = 'skip' THEN -1
                        ELSE 0
                    END
                ) / NULLIF(COUNT(*), 0)
            ) / 10.0, 
            0.0
        )
    INTO engagement_score
    FROM user_interactions 
    WHERE user_id = user_uuid 
    AND timestamp > NOW() - INTERVAL '30 days';
    
    RETURN LEAST(GREATEST(engagement_score, 0.0), 1.0);
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for user analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS user_analytics AS
SELECT 
    up.id as user_id,
    up.age,
    up.profession,
    up.gender,
    up.location->>'country' as country,
    COUNT(ui.id) as total_interactions,
    COUNT(DISTINCT ui.category) as categories_explored,
    AVG(ui.read_time) as avg_read_time,
    calculate_user_engagement_score(up.id) as engagement_score,
    MAX(ui.timestamp) as last_interaction,
    EXTRACT(EPOCH FROM (MAX(ui.timestamp) - MIN(ui.timestamp))) / 86400 as days_active
FROM user_profiles up
LEFT JOIN user_interactions ui ON up.id = ui.user_id
GROUP BY up.id, up.age, up.profession, up.gender, up.location;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_user_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_analytics;
END;
$$ LANGUAGE plpgsql;

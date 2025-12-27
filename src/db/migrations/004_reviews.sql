-- Migration 004: Reviews, Review Categories, and Trainer Responses
-- This migration creates tables for the social features functionality

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  categories JSONB NOT NULL DEFAULT '{}',
  comment TEXT NOT NULL,
  helpful INTEGER DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review categories table
CREATE TABLE IF NOT EXISTS review_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trainer responses table
CREATE TABLE IF NOT EXISTS trainer_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  response TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helpful votes table
CREATE TABLE IF NOT EXISTS helpful_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  helpful BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_trainer_id ON reviews(trainer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_timestamp ON reviews(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_helpful ON reviews(helpful DESC);

CREATE INDEX IF NOT EXISTS idx_trainer_responses_review_id ON trainer_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_trainer_responses_trainer_id ON trainer_responses(trainer_id);

CREATE INDEX IF NOT EXISTS idx_helpful_votes_review_id ON helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_helpful_votes_user_id ON helpful_votes(user_id);

-- Insert default review categories
INSERT INTO review_categories (name, description) VALUES
  ('Communication', 'How well the trainer communicates with clients'),
  ('Professionalism', 'Professional conduct and behavior'),
  ('Expertise', 'Knowledge and skill in dog training'),
  ('Patience', 'Patience with dogs and owners'),
  ('Results', 'Effectiveness of training methods')
ON CONFLICT (name) DO NOTHING;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE reviews IS 'Stores user reviews for trainers';
COMMENT ON TABLE review_categories IS 'Predefined categories for review ratings';
COMMENT ON TABLE trainer_responses IS 'Stores trainer responses to reviews';
COMMENT ON TABLE helpful_votes IS 'Stores user votes on review helpfulness';

COMMENT ON COLUMN reviews.rating IS 'Overall rating from 1 to 5 stars';
COMMENT ON COLUMN reviews.categories IS 'JSON object with category-specific ratings';
COMMENT ON COLUMN reviews.helpful IS 'Count of helpful votes';
COMMENT ON COLUMN reviews.timestamp IS 'When the review was created';
COMMENT ON COLUMN trainer_responses.response IS 'Trainer''s response text';
COMMENT ON COLUMN helpful_votes.helpful IS 'True if user found review helpful, false otherwise';

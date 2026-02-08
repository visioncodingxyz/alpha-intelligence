-- Create gallery_items table to store user-generated images and videos
CREATE TABLE IF NOT EXISTS gallery_items (
  id BIGINT PRIMARY KEY,
  blob_url VARCHAR(500) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  prompt TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  vote_ratio DECIMAL(5,4) DEFAULT 0,
  content_type VARCHAR(10) DEFAULT 'image',
  nsfw BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create photo_votes table to track individual user votes
CREATE TABLE IF NOT EXISTS photo_votes (
  id SERIAL PRIMARY KEY,
  gallery_item_id BIGINT NOT NULL REFERENCES gallery_items(id) ON DELETE CASCADE,
  user_identifier VARCHAR(255) NOT NULL,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(gallery_item_id, user_identifier)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gallery_items_content_type ON gallery_items(content_type);
CREATE INDEX IF NOT EXISTS idx_gallery_items_created_at ON gallery_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_items_vote_ratio ON gallery_items(vote_ratio DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_items_nsfw ON gallery_items(nsfw);
CREATE INDEX IF NOT EXISTS idx_photo_votes_gallery_item ON photo_votes(gallery_item_id);
CREATE INDEX IF NOT EXISTS idx_photo_votes_user ON photo_votes(user_identifier);

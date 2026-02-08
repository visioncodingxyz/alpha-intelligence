-- Add content_type column to gallery_items table to distinguish between images and videos
ALTER TABLE gallery_items 
ADD COLUMN IF NOT EXISTS content_type VARCHAR(10) DEFAULT 'image';

-- Add index for better performance when filtering by content type
CREATE INDEX IF NOT EXISTS idx_gallery_items_content_type ON gallery_items(content_type);

-- Update existing records to have 'image' as content_type
UPDATE gallery_items SET content_type = 'image' WHERE content_type IS NULL;

-- Add NSFW column to gallery_items table
ALTER TABLE gallery_items 
ADD COLUMN nsfw BOOLEAN DEFAULT false;

-- Update all existing images to be marked as NSFW
UPDATE gallery_items 
SET nsfw = true;

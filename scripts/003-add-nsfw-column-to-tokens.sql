-- Add NSFW column to tokens table for content filtering
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS nsfw BOOLEAN DEFAULT false;

-- Create index for efficient NSFW filtering
CREATE INDEX IF NOT EXISTS idx_tokens_nsfw ON tokens(nsfw);

-- Update existing tokens to be marked as NSFW (as requested)
UPDATE tokens SET nsfw = true WHERE nsfw IS NULL OR nsfw = false;

-- Add comment for documentation
COMMENT ON COLUMN tokens.nsfw IS 'Indicates if token content is Not Safe For Work (adult content)';

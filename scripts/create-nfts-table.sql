-- Create NFTs table for storing minted NFT data
CREATE TABLE IF NOT EXISTS nfts (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  collection_id VARCHAR(255) NOT NULL,
  crossmint_id VARCHAR(255),
  action_id VARCHAR(255),
  mint_status VARCHAR(50) DEFAULT 'pending',
  transaction_hash VARCHAR(255),
  nsfw BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on wallet_address for faster queries
CREATE INDEX IF NOT EXISTS idx_nfts_wallet_address ON nfts(wallet_address);

-- Create index on crossmint_id for status checks
CREATE INDEX IF NOT EXISTS idx_nfts_crossmint_id ON nfts(crossmint_id);

-- Create index on action_id for status checks
CREATE INDEX IF NOT EXISTS idx_nfts_action_id ON nfts(action_id);

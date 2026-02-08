-- Create token_purchases table to track user token purchases
CREATE TABLE IF NOT EXISTS token_purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  wallet_address VARCHAR(255) NOT NULL,
  transaction_signature VARCHAR(255) UNIQUE NOT NULL,
  token_amount BIGINT NOT NULL, -- Amount of tokens purchased (in smallest unit)
  sol_amount BIGINT NOT NULL, -- Amount of SOL spent (in lamports)
  credits_awarded INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_token_purchases_wallet_address ON token_purchases(wallet_address);
CREATE INDEX IF NOT EXISTS idx_token_purchases_user_id ON token_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_token_purchases_created_at ON token_purchases(created_at);

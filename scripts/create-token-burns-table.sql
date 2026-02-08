-- Updated comment to reference AURA tokens instead of LUST
-- Create token_burns table to track AURA token burning transactions
CREATE TABLE IF NOT EXISTS token_burns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  wallet_address VARCHAR(255) NOT NULL,
  transaction_signature VARCHAR(255) UNIQUE NOT NULL,
  token_amount BIGINT NOT NULL, -- Raw token amount (with 9 decimals)
  credits_awarded BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_token_burns_wallet_address ON token_burns(wallet_address);
CREATE INDEX IF NOT EXISTS idx_token_burns_user_id ON token_burns(user_id);
CREATE INDEX IF NOT EXISTS idx_token_burns_created_at ON token_burns(created_at);

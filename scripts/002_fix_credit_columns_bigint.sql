-- Migration to fix credit columns that are too small for large credit values
-- Change INTEGER columns to BIGINT to handle values > 2.1 billion

-- Update the users table credit_balance column
ALTER TABLE users 
ALTER COLUMN credit_balance TYPE BIGINT;

-- Update the token_purchases table credits_awarded column  
ALTER TABLE token_purchases 
ALTER COLUMN credits_awarded TYPE BIGINT;

-- Verify the changes
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('users', 'token_purchases') 
    AND column_name IN ('credit_balance', 'credits_awarded')
ORDER BY table_name, column_name;

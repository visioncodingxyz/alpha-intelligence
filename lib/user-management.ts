import { sql, isDatabaseAvailable } from "./database"

export interface User {
  id: number
  wallet_address: string
  credit_balance: number
  created_at: string
  updated_at: string
}

// Create a new user with default 5 credits
export async function createUser(walletAddress: string): Promise<User> {
  if (!isDatabaseAvailable()) {
    throw new Error("Database not available. Please configure your Neon integration.")
  }

  try {
    const result = await sql!`
      INSERT INTO users (wallet_address, credit_balance)
      VALUES (${walletAddress}, 5)
      RETURNING *
    `
    return result[0] as User
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

// Find user by wallet address
export async function findUserByWallet(walletAddress: string): Promise<User | null> {
  if (!isDatabaseAvailable()) {
    console.warn("Database not available, returning null user")
    return null
  }

  try {
    const result = await sql!`
      SELECT * FROM users 
      WHERE wallet_address = ${walletAddress}
      LIMIT 1
    `
    return result.length > 0 ? (result[0] as User) : null
  } catch (error) {
    console.error("Error finding user:", error)
    throw error
  }
}

export async function getOrCreateUser(walletAddress: string): Promise<User> {
  if (!isDatabaseAvailable()) {
    throw new Error("Database not available. Please configure your Neon integration.")
  }

  try {
    // First try to find existing user
    const user = await findUserByWallet(walletAddress)

    if (user) {
      return user
    }

    // If user doesn't exist, try to create one
    // Use INSERT ... ON CONFLICT to handle race conditions
    const result = await sql!`
      INSERT INTO users (wallet_address, credit_balance)
      VALUES (${walletAddress}, 5)
      ON CONFLICT (wallet_address) 
      DO UPDATE SET updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    console.log(`Created or found existing user for wallet: ${walletAddress}`)
    return result[0] as User
  } catch (error) {
    console.error("Error getting or creating user:", error)
    throw error
  }
}

// Update user credit balance
export async function updateUserCredits(walletAddress: string, newBalance: number): Promise<User> {
  if (!isDatabaseAvailable()) {
    throw new Error("Database not available. Please configure your Neon integration.")
  }

  try {
    const result = await sql!`
      UPDATE users 
      SET credit_balance = ${newBalance}
      WHERE wallet_address = ${walletAddress}
      RETURNING *
    `

    if (result.length === 0) {
      throw new Error("User not found")
    }

    return result[0] as User
  } catch (error) {
    console.error("Error updating user credits:", error)
    throw error
  }
}

// Deduct credits from user
export async function deductUserCredits(walletAddress: string, amount: number): Promise<User> {
  if (!isDatabaseAvailable()) {
    throw new Error("Database not available. Please configure your Neon integration.")
  }

  try {
    const result = await sql!`
      UPDATE users 
      SET credit_balance = GREATEST(credit_balance - ${amount}, 0)
      WHERE wallet_address = ${walletAddress}
      RETURNING *
    `

    if (result.length === 0) {
      throw new Error("User not found")
    }

    return result[0] as User
  } catch (error) {
    console.error("Error deducting user credits:", error)
    throw error
  }
}

// Add credits to user
export async function addUserCredits(walletAddress: string, amount: number): Promise<User> {
  if (!isDatabaseAvailable()) {
    throw new Error("Database not available. Please configure your Neon integration.")
  }

  try {
    const result = await sql!`
      UPDATE users 
      SET credit_balance = credit_balance + ${amount}
      WHERE wallet_address = ${walletAddress}
      RETURNING *
    `

    if (result.length === 0) {
      throw new Error("User not found")
    }

    return result[0] as User
  } catch (error) {
    console.error("Error adding user credits:", error)
    throw error
  }
}

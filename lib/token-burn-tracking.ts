import { sql } from "./database"
import { getOrCreateUser, addUserCredits } from "./user-management"

export interface TokenBurn {
  id: number
  user_id: number
  wallet_address: string
  transaction_signature: string
  token_amount: number
  credits_awarded: number
  created_at: string
  updated_at: string
}

export async function recordTokenBurn(
  walletAddress: string,
  transactionSignature: string,
  tokenAmount: number, // Expects actual token amount (already converted from raw)
): Promise<{ success: boolean; creditsAwarded?: number; error?: string }> {
  try {
    console.log("[v0] Recording token burn", { walletAddress, transactionSignature, tokenAmount })

    const user = await getOrCreateUser(walletAddress)

    const creditsAwarded = Math.floor(tokenAmount / 100000) * 3
    console.log("[v0] Credits calculation for burn:", {
      tokenAmount,
      creditsAwarded,
    })

    // Convert to raw amount for database storage (multiply by 10^9)
    const rawTokenAmount = Math.floor(tokenAmount * Math.pow(10, 9))

    // Record the burn
    const result = await sql`
      INSERT INTO token_burns (
        user_id, 
        wallet_address, 
        transaction_signature, 
        token_amount, 
        credits_awarded
      )
      VALUES (
        ${user.id}, 
        ${walletAddress}, 
        ${transactionSignature}, 
        ${rawTokenAmount}, 
        ${creditsAwarded}
      )
      ON CONFLICT (transaction_signature) DO NOTHING
      RETURNING *
    `

    if (result.length === 0) {
      // Transaction already recorded
      return { success: true, creditsAwarded: 0 }
    }

    if (creditsAwarded > 0) {
      await addUserCredits(walletAddress, creditsAwarded)
    }

    console.log("[v0] Token burn recorded successfully", { creditsAwarded })
    return { success: true, creditsAwarded }
  } catch (error) {
    console.error("[v0] Error recording token burn:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function getUserTokenBurns(walletAddress: string): Promise<TokenBurn[]> {
  try {
    const burns = await sql`
      SELECT * FROM token_burns 
      WHERE wallet_address = ${walletAddress}
      ORDER BY created_at DESC
    `
    return burns as TokenBurn[]
  } catch (error) {
    console.error("[v0] Error fetching token burns:", error)
    return []
  }
}

export async function getTotalTokensBurned(walletAddress: string): Promise<number> {
  try {
    const result = await sql`
      SELECT COALESCE(SUM(token_amount), 0) as total
      FROM token_burns 
      WHERE wallet_address = ${walletAddress}
    `
    const rawTotal = Number(result[0]?.total || 0)
    return rawTotal / Math.pow(10, 9)
  } catch (error) {
    console.error("[v0] Error fetching total tokens burned:", error)
    return 0
  }
}

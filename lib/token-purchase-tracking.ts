import { sql } from "./database"
import { getOrCreateUser, addUserCredits } from "./user-management"

export interface TokenPurchase {
  id: number
  user_id: number
  wallet_address: string
  transaction_signature: string
  token_amount: number
  sol_amount: number
  credits_awarded: number
  created_at: string
  updated_at: string
}

export async function recordTokenPurchase(
  walletAddress: string,
  transactionSignature: string,
  tokenAmount: number, // This is actually the number of credits to award, not token amount
  solAmount: number, // This is in lamports
): Promise<{ success: boolean; creditsAwarded?: number; error?: string }> {
  try {
    console.log("[v0] Recording credit purchase", {
      walletAddress,
      transactionSignature,
      creditsRequested: tokenAmount,
      solAmountLamports: solAmount,
    })

    const user = await getOrCreateUser(walletAddress)

    const creditsAwarded = tokenAmount
    console.log("[v0] Credits to award:", creditsAwarded)

    const result = await sql`
      INSERT INTO token_purchases (
        user_id, 
        wallet_address, 
        transaction_signature, 
        token_amount, 
        sol_amount, 
        credits_awarded
      )
      VALUES (
        ${user.id}, 
        ${walletAddress}, 
        ${transactionSignature}, 
        ${tokenAmount}, 
        ${solAmount}, 
        ${creditsAwarded}
      )
      ON CONFLICT (transaction_signature) DO NOTHING
      RETURNING *
    `

    if (result.length === 0) {
      // Transaction already recorded
      console.log("[v0] Transaction already recorded, skipping credit award")
      return { success: true, creditsAwarded: 0 }
    }

    if (creditsAwarded > 0) {
      console.log("[v0] Adding credits to user:", { walletAddress, creditsAwarded })
      await addUserCredits(walletAddress, creditsAwarded)
      console.log("[v0] Credits added successfully")
    }

    console.log("[v0] Credit purchase recorded successfully", { creditsAwarded })
    return { success: true, creditsAwarded }
  } catch (error) {
    console.error("[v0] Error recording credit purchase:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function getUserTokenPurchases(walletAddress: string): Promise<TokenPurchase[]> {
  try {
    const purchases = await sql`
      SELECT * FROM token_purchases 
      WHERE wallet_address = ${walletAddress}
      ORDER BY created_at DESC
    `
    return purchases as TokenPurchase[]
  } catch (error) {
    console.error("[v0] Error fetching token purchases:", error)
    return []
  }
}

export async function getTotalTokensPurchased(walletAddress: string): Promise<number> {
  try {
    const result = await sql`
      SELECT COALESCE(SUM(token_amount), 0) as total
      FROM token_purchases 
      WHERE wallet_address = ${walletAddress}
    `
    const rawTotal = Number(result[0]?.total || 0)
    return rawTotal / Math.pow(10, 9)
  } catch (error) {
    console.error("[v0] Error fetching total tokens purchased:", error)
    return 0
  }
}

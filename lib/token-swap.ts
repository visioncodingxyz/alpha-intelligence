import { Connection, type PublicKey, type Transaction } from "@solana/web3.js"
import { jupiterAPI } from "./jupiter-api"

const getRpcUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL

  if (envUrl && (envUrl.startsWith("http://") || envUrl.startsWith("https://"))) {
    return envUrl
  }

  return "https://api.mainnet-beta.solana.com"
}

export interface SwapResult {
  success: boolean
  signature?: string
  error?: string
  tokenAmount?: number
  solAmount?: number
}

export class TokenSwapService {
  private connection: Connection

  constructor() {
    const rpcUrl = getRpcUrl()
    this.connection = new Connection(rpcUrl, "confirmed")
    console.log("[v0] TokenSwapService initialized with RPC:", rpcUrl.substring(0, 30) + "...")
  }

  async swapSolToLUST(
    walletPublicKey: PublicKey,
    solAmount: number, // Amount in SOL
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
  ): Promise<SwapResult> {
    try {
      console.log("[v0] Initiating SOL to LUST swap", { walletPublicKey: walletPublicKey.toString(), solAmount })

      // Convert SOL to lamports
      const lamports = jupiterAPI.solToLamports(solAmount)

      // Use Jupiter API for the swap
      const result = await jupiterAPI.swapSolToLUST(
        lamports,
        walletPublicKey,
        signTransaction as any, // Type compatibility
      )

      if (result.success) {
        return {
          success: true,
          signature: result.signature,
          tokenAmount: result.outputAmount || 0,
          solAmount: result.inputAmount || lamports,
        }
      } else {
        return {
          success: false,
          error: result.error || "Swap failed",
        }
      }
    } catch (error) {
      console.error("[v0] Swap error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  // Calculate credits based on token amount (1 credit per 100k tokens)
  calculateCreditsFromTokens(tokenAmount: number): number {
    return jupiterAPI.calculateCreditsFromTokens(tokenAmount)
  }

  async swapSolToAURA(
    walletPublicKey: PublicKey,
    solAmount: number, // Amount in SOL
    signTransaction: (transaction: Transaction) => Promise<Transaction>,
  ): Promise<SwapResult> {
    try {
      console.log("[v0] Initiating SOL to AURA swap", { walletPublicKey: walletPublicKey.toString(), solAmount })

      // Convert SOL to lamports
      const lamports = jupiterAPI.solToLamports(solAmount)

      // Use Jupiter API for the swap
      const result = await jupiterAPI.swapSolToAURA(
        lamports,
        walletPublicKey,
        signTransaction as any, // Type compatibility
      )

      if (result.success) {
        return {
          success: true,
          signature: result.signature,
          tokenAmount: result.outputAmount || 0,
          solAmount: result.inputAmount || lamports,
        }
      } else {
        return {
          success: false,
          error: result.error || "Swap failed",
        }
      }
    } catch (error) {
      console.error("[v0] Swap error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }
}

export const tokenSwapService = new TokenSwapService()

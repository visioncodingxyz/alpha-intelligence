import {
  Connection,
  PublicKey,
  type Transaction,
  VersionedTransaction,
  TransactionMessage,
  ComputeBudgetProgram,
} from "@solana/web3.js"
import {
  createBurnInstruction,
  getAssociatedTokenAddress,
  getAccount,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"
import { Buffer } from "buffer"

export const AURA_TOKEN_MINT = new PublicKey("ALsArNgSCH3RczsGJYvKxc1LT993h3etw3MePAUxEREV")
export const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112")

const getRpcUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL

  console.log("[v0] Environment variable NEXT_PUBLIC_SOLANA_RPC_URL:", envUrl)
  console.log("[v0] Type of env var:", typeof envUrl)
  console.log("[v0] Length of env var:", envUrl?.length)

  if (!envUrl) {
    throw new Error("NEXT_PUBLIC_SOLANA_RPC_URL environment variable is required")
  }

  const trimmedUrl = envUrl.trim()

  if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
    console.error("[v0] Invalid URL format. Expected URL:", trimmedUrl)
    throw new Error(`NEXT_PUBLIC_SOLANA_RPC_URL must be a valid HTTP/HTTPS URL. Got: "${trimmedUrl}"`)
  }

  console.log("[v0] Using custom RPC URL:", trimmedUrl.substring(0, 50) + "...")
  return trimmedUrl
}

export interface JupiterQuoteResponse {
  inputMint: string
  inAmount: string
  outputMint: string
  outAmount: string
  otherAmountThreshold: string
  swapMode: string
  slippageBps: number
  platformFee?: {
    amount: string
    feeBps: number
  }
  priceImpactPct: string
  routePlan: Array<{
    swapInfo: {
      ammKey: string
      label: string
      inputMint: string
      outputMint: string
      inAmount: string
      outAmount: string
      feeAmount: string
      feeMint: string
    }
    percent: number
  }>
  contextSlot: number
  timeTaken: number
}

export interface JupiterSwapResponse {
  swapTransaction: string
  lastValidBlockHeight: number
}

export class JupiterAPIService {
  private connection: Connection
  private baseUrl = "https://quote-api.jup.ag/v6"
  private rpcUrl: string

  constructor(rpcEndpoint?: string) {
    this.rpcUrl = rpcEndpoint || getRpcUrl()

    try {
      this.connection = new Connection(this.rpcUrl, "confirmed")
      console.log("[v0] Jupiter API initialized with RPC:", this.rpcUrl.substring(0, 50) + "...")
    } catch (error) {
      console.error("[v0] Failed to initialize Solana connection:", error)
      throw new Error(`Failed to initialize Solana connection: ${error}`)
    }
  }

  async getQuote(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps = 50,
  ): Promise<JupiterQuoteResponse> {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
      onlyDirectRoutes: "false",
      asLegacyTransaction: "false",
    })

    const response = await fetch(`${this.baseUrl}/quote?${params}`)

    if (!response.ok) {
      throw new Error(`Failed to get quote: ${response.statusText}`)
    }

    return response.json()
  }

  async getSwapTransaction(
    quote: JupiterQuoteResponse,
    userPublicKey: string,
    wrapAndUnwrapSol = true,
  ): Promise<JupiterSwapResponse> {
    const response = await fetch(`${this.baseUrl}/swap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey,
        wrapAndUnwrapSol,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto",
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get swap transaction: ${response.statusText}`)
    }

    return response.json()
  }

  async executeSwap(
    inputMint: string,
    outputMint: string,
    amount: number,
    userPublicKey: PublicKey,
    signTransaction: (transaction: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>,
    slippageBps = 50,
  ): Promise<{
    success: boolean
    signature?: string
    error?: string
    inputAmount?: number
    outputAmount?: number
  }> {
    try {
      console.log("[v0] Getting Jupiter quote...", {
        inputMint,
        outputMint,
        amount,
        slippageBps,
      })

      // Get quote
      const quote = await this.getQuote(inputMint, outputMint, amount, slippageBps)

      console.log("[v0] Quote received:", {
        inputAmount: quote.inAmount,
        outputAmount: quote.outAmount,
        priceImpact: quote.priceImpactPct,
      })

      // Get swap transaction
      const { swapTransaction } = await this.getSwapTransaction(quote, userPublicKey.toString())

      // Deserialize transaction
      const transactionBuf = Buffer.from(swapTransaction, "base64")
      const transaction = VersionedTransaction.deserialize(transactionBuf)

      console.log("[v0] Transaction created, requesting signature...")

      let signedTransaction: Transaction | VersionedTransaction
      try {
        signedTransaction = await signTransaction(transaction)
        console.log("[v0] Transaction signed successfully")
      } catch (signError) {
        console.error("[v0] Transaction signing failed:", signError)

        if (signError instanceof Error) {
          if (signError.message.includes("User rejected")) {
            throw new Error("Transaction was rejected by user")
          } else if (signError.message.includes("not been authorized")) {
            throw new Error("Wallet authorization required. Please ensure your wallet is unlocked and try again.")
          }
        }
        throw signError
      }

      console.log("[v0] Burn transaction signed, sending...")

      let signature: string
      try {
        signature = await this.sendTransaction(signedTransaction)
        console.log("[v0] Transaction sent:", signature)
      } catch (sendError) {
        console.error("[v0] Transaction send failed:", sendError)
        throw new Error(
          `Failed to send transaction: ${sendError instanceof Error ? sendError.message : "Unknown error"}`,
        )
      }

      // Confirm transaction
      const confirmation = await this.connection.confirmTransaction(signature, "confirmed")

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`)
      }

      console.log("[v0] Transaction confirmed:", signature)

      return {
        success: true,
        signature,
        inputAmount: Number.parseInt(quote.inAmount),
        outputAmount: Number.parseInt(quote.outAmount),
      }
    } catch (error) {
      console.error("[v0] Jupiter swap error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  private async sendTransaction(signedTransaction: Transaction | VersionedTransaction): Promise<string> {
    console.log(`[v0] Sending transaction with RPC:`, this.rpcUrl.substring(0, 50) + "...")

    return await this.connection.sendRawTransaction(signedTransaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
      maxRetries: 3,
    })
  }

  async swapSolToAURA(
    solAmount: number, // Amount in lamports
    userPublicKey: PublicKey,
    signTransaction: (transaction: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>,
    slippageBps = 100, // Updated default slippage from 50 to 100 basis points (1%)
  ) {
    return this.executeSwap(
      SOL_MINT.toString(),
      AURA_TOKEN_MINT.toString(),
      solAmount,
      userPublicKey,
      signTransaction,
      slippageBps,
    )
  }

  async burnAURATokens(
    tokenAmount: number, // Amount of tokens to burn (actual tokens, not raw)
    userPublicKey: PublicKey,
    signTransaction: (transaction: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>,
    slippageBps = 100,
  ) {
    // Convert actual tokens to raw amount for the burn (AURA has 9 decimals)
    const rawTokenAmount = Math.floor(tokenAmount * Math.pow(10, 9))

    try {
      console.log("[v0] Creating proper burn transaction...", {
        tokenAmount,
        rawTokenAmount,
        mint: AURA_TOKEN_MINT.toString(),
      })

      const associatedTokenAccount = await getAssociatedTokenAddress(AURA_TOKEN_MINT, userPublicKey)
      console.log("[v0] Expected associated token account address:", associatedTokenAccount.toString())

      let tokenAccountAddress: PublicKey
      let tokenBalance: bigint

      try {
        const accountInfo = await getAccount(this.connection, associatedTokenAccount)

        console.log("[v0] Associated token account found:")
        console.log("[v0] - Address:", associatedTokenAccount.toString())
        console.log("[v0] - Balance:", accountInfo.amount.toString())
        console.log("[v0] - Mint:", accountInfo.mint.toString())
        console.log("[v0] - Owner:", accountInfo.owner.toString())

        if (!accountInfo.mint.equals(AURA_TOKEN_MINT)) {
          throw new Error(
            `Token account mint mismatch. Expected: ${AURA_TOKEN_MINT.toString()}, Found: ${accountInfo.mint.toString()}`,
          )
        }

        if (!accountInfo.owner.equals(userPublicKey)) {
          throw new Error(
            `Token account owner mismatch. Expected: ${userPublicKey.toString()}, Found: ${accountInfo.owner.toString()}`,
          )
        }

        tokenAccountAddress = associatedTokenAccount
        tokenBalance = accountInfo.amount
      } catch (associatedAccountError) {
        console.log("[v0] Associated token account does not exist or is invalid:", associatedAccountError)

        const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(userPublicKey, {
          mint: AURA_TOKEN_MINT,
        })

        console.log("[v0] Found token accounts:", tokenAccounts.value.length)

        if (tokenAccounts.value.length === 0) {
          throw new Error("No AURA token accounts found for this wallet. Please ensure you have AURA tokens.")
        }

        let sourceAccount = tokenAccounts.value[0]
        let sourceBalance = BigInt(0)

        for (const account of tokenAccounts.value) {
          const parsedInfo = account.account.data.parsed.info
          const accountBalance = BigInt(parsedInfo.tokenAmount.amount)

          console.log("[v0] Token account:", account.pubkey.toString(), "Balance:", accountBalance.toString())

          if (accountBalance > sourceBalance) {
            sourceAccount = account
            sourceBalance = accountBalance
          }
        }

        if (sourceBalance === BigInt(0)) {
          throw new Error("All found token accounts have zero balance. Please ensure you have AURA tokens.")
        }

        console.log(
          "[v0] Source account with balance found:",
          sourceAccount.pubkey.toString(),
          "Balance:",
          sourceBalance.toString(),
        )

        const createATAInstruction = createAssociatedTokenAccountInstruction(
          userPublicKey, // payer
          associatedTokenAccount, // associated token account
          userPublicKey, // owner
          AURA_TOKEN_MINT, // mint
        )

        const transferInstruction = createTransferInstruction(
          sourceAccount.pubkey, // source
          associatedTokenAccount, // destination
          userPublicKey, // owner
          BigInt(rawTokenAmount), // amount to transfer (only what we need to burn)
          [], // additional signers
          TOKEN_PROGRAM_ID,
        )

        console.log("[v0] Creating associated token account and transferring tokens for burn...")

        const setupInstructions = [createATAInstruction, transferInstruction]

        const computeUnitLimitInstruction = ComputeBudgetProgram.setComputeUnitLimit({
          units: 400_000, // Increased for multiple instructions
        })

        const computeUnitPriceInstruction = ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: 5000,
        })

        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash()

        const setupMessageV0 = new TransactionMessage({
          payerKey: userPublicKey,
          recentBlockhash: blockhash,
          instructions: [computeUnitLimitInstruction, computeUnitPriceInstruction, ...setupInstructions],
        }).compileToV0Message()

        const setupTransaction = new VersionedTransaction(setupMessageV0)

        console.log("[v0] Setup transaction created, requesting signature...")

        const signedSetupTransaction = await signTransaction(setupTransaction)
        console.log("[v0] Setup transaction signed, sending...")

        const setupSignature = await this.sendTransaction(signedSetupTransaction)
        console.log("[v0] Setup transaction sent:", setupSignature)

        const setupConfirmation = await this.connection.confirmTransaction(
          {
            signature: setupSignature,
            blockhash,
            lastValidBlockHeight,
          },
          "confirmed",
        )

        if (setupConfirmation.value.err) {
          throw new Error(`Setup transaction failed: ${setupConfirmation.value.err}`)
        }

        console.log("[v0] Setup transaction confirmed, now using associated token account for burn")

        tokenAccountAddress = associatedTokenAccount
        tokenBalance = BigInt(rawTokenAmount) // We transferred exactly what we need
      }

      if (tokenBalance < BigInt(rawTokenAmount)) {
        throw new Error(
          `Insufficient token balance. You have ${Number(tokenBalance) / Math.pow(10, 9)} AURA, but trying to burn ${tokenAmount} AURA.`,
        )
      }

      const computeUnitLimitInstruction = ComputeBudgetProgram.setComputeUnitLimit({
        units: 300_000,
      })

      const computeUnitPriceInstruction = ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 5000,
      })

      const burnInstruction = createBurnInstruction(
        tokenAccountAddress, // Source account (associated token account)
        AURA_TOKEN_MINT, // Mint address
        userPublicKey, // Owner of the token account
        BigInt(rawTokenAmount), // Amount to burn (in base units)
        [], // Additional signers (empty for single signature)
        TOKEN_PROGRAM_ID, // Token program ID
      )

      console.log("[v0] Burn instruction created with:", {
        tokenAccount: tokenAccountAddress.toString(),
        mint: AURA_TOKEN_MINT.toString(),
        authority: userPublicKey.toString(),
        amount: rawTokenAmount.toString(),
      })

      const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash()

      const messageV0 = new TransactionMessage({
        payerKey: userPublicKey,
        recentBlockhash: blockhash,
        instructions: [computeUnitLimitInstruction, computeUnitPriceInstruction, burnInstruction],
      }).compileToV0Message()

      const transaction = new VersionedTransaction(messageV0)

      console.log("[v0] Burn transaction created, requesting signature...")

      let signedTransaction: Transaction | VersionedTransaction
      try {
        signedTransaction = await signTransaction(transaction)
        console.log("[v0] Burn transaction signed successfully")
      } catch (signError) {
        console.error("[v0] Burn transaction signing failed:", signError)

        if (signError instanceof Error) {
          if (signError.message.includes("User rejected")) {
            throw new Error("Transaction was rejected by user")
          } else if (signError.message.includes("not been authorized")) {
            throw new Error("Wallet authorization required. Please ensure your wallet is unlocked and try again.")
          }
        }
        throw signError
      }

      console.log("[v0] Burn transaction signed, sending...")

      let signature: string
      try {
        signature = await this.sendTransaction(signedTransaction)
        console.log("[v0] Burn transaction sent:", signature)
      } catch (sendError) {
        console.error("[v0] Burn transaction send failed:", sendError)
        throw new Error(
          `Failed to send burn transaction: ${sendError instanceof Error ? sendError.message : "Unknown error"}`,
        )
      }

      const confirmation = await this.connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        "confirmed",
      )

      if (confirmation.value.err) {
        throw new Error(`Burn transaction failed: ${confirmation.value.err}`)
      }

      console.log("[v0] Burn transaction confirmed:", signature)

      return {
        success: true,
        signature,
        inputAmount: rawTokenAmount,
        outputAmount: 0, // No output for burn operations
      }
    } catch (error) {
      console.error("[v0] Token burn error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  calculateCreditsFromBurn(tokenAmount: number): number {
    const hundredKTokens = Math.floor(tokenAmount / 100000)
    return hundredKTokens * 3
  }

  calculateCreditsFromTokens(tokenAmount: number): number {
    const hundredKTokens = Math.floor(tokenAmount / 100000)
    return hundredKTokens * 5
  }

  solToLamports(sol: number): number {
    return Math.floor(sol * 1000000000) // 1 SOL = 1B lamports
  }

  lamportsToSol(lamports: number): number {
    return lamports / 1000000000
  }
}

export const jupiterAPI = new JupiterAPIService()

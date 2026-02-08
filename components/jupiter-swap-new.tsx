"use client"

import { useState, useCallback, useEffect } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { jupiterAPI, AURA_TOKEN_MINT } from "@/lib/jupiter-api"

interface JupiterSwapNewProps {
  onSwapSuccess?: (txid: string, tokenAmount: number, solAmount: number) => void
  onSwapError?: (error: string) => void
}

export function JupiterSwapNew({ onSwapSuccess, onSwapError }: JupiterSwapNewProps) {
  const { connected, publicKey, signTransaction, wallet, connecting } = useWallet()
  const { connection } = useConnection()
  const [solAmount, setSolAmount] = useState("0.01")
  const [isSwapping, setIsSwapping] = useState(false)
  const [quote, setQuote] = useState<any>(null)
  const [isGettingQuote, setIsGettingQuote] = useState(false)

  const getQuote = useCallback(async () => {
    if (!solAmount || Number.parseFloat(solAmount) <= 0) {
      setQuote(null)
      return
    }

    setIsGettingQuote(true)
    try {
      const lamports = jupiterAPI.solToLamports(Number.parseFloat(solAmount))
      const quoteResponse = await jupiterAPI.getQuote(
        "So11111111111111111111111111111111111111112", // SOL
        AURA_TOKEN_MINT.toString(),
        lamports,
      )

      setQuote(quoteResponse)
      console.log("[v0] Quote updated:", {
        inputSOL: jupiterAPI.lamportsToSol(Number.parseInt(quoteResponse.inAmount)),
        outputAURA: Number.parseInt(quoteResponse.outAmount),
        priceImpact: quoteResponse.priceImpactPct,
      })
    } catch (error) {
      console.error("[v0] Error getting quote:", error)
      toast.error("Failed to get quote")
      setQuote(null)
    } finally {
      setIsGettingQuote(false)
    }
  }, [solAmount])

  useEffect(() => {
    if (!connected || !solAmount || Number.parseFloat(solAmount) <= 0) {
      setQuote(null)
      return
    }

    // Debounce the quote request to avoid too many API calls while typing
    const timeoutId = setTimeout(() => {
      getQuote()
    }, 500) // 500ms delay after user stops typing

    return () => clearTimeout(timeoutId)
  }, [solAmount, connected, getQuote])

  const handleSwap = async () => {
    if (!connected || !publicKey || !signTransaction || !wallet) {
      toast.error("Please connect your wallet")
      return
    }

    if (connecting) {
      toast.error("Wallet is still connecting, please wait")
      return
    }

    if (!wallet.readyState || wallet.readyState !== "Installed") {
      toast.error("Wallet is not ready. Please ensure your wallet is properly installed and unlocked.")
      return
    }

    if (!quote) {
      toast.error("Please wait for quote to load")
      return
    }

    const solAmountNum = Number.parseFloat(solAmount)
    if (solAmountNum <= 0 || solAmountNum < 0.001) {
      toast.error("Minimum swap amount is 0.001 SOL")
      return
    }

    setIsSwapping(true)
    try {
      const lamports = jupiterAPI.solToLamports(solAmountNum)

      console.log("[v0] Starting swap with validated wallet:", {
        connected,
        publicKey: publicKey.toString(),
        walletName: wallet.adapter.name,
        readyState: wallet.readyState,
        lamports,
      })

      const result = await jupiterAPI.swapSolToAURA(lamports, publicKey, signTransaction, 100)

      if (result.success && result.signature) {
        const tokenAmount = result.outputAmount || 0
        const solAmountUsed = result.inputAmount || lamports

        console.log("[v0] Recording token purchase", {
          walletAddress: publicKey.toString(),
          transactionSignature: result.signature,
          tokenAmount: tokenAmount,
          solAmount: solAmountUsed,
        })

        if (tokenAmount > 0) {
          try {
            const response = await fetch("/api/token-purchase", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                walletAddress: publicKey.toString(),
                transactionSignature: result.signature,
                tokenAmount: tokenAmount,
                solAmount: solAmountUsed,
              }),
            })

            const purchaseResult = await response.json()

            if (response.ok && purchaseResult.success) {
              console.log("[v0] Swap completed:", {
                txid: result.signature,
                tokenAmount,
                solAmount: solAmountUsed,
              })
              console.log("[v0] Credits earned from swap:", purchaseResult.creditsAwarded)

              toast.success(
                <div className="space-y-2">
                  <div className="font-semibold">Swap Successful!</div>
                  <div className="text-sm">
                    {purchaseResult.creditsAwarded ? (
                      <div>{purchaseResult.creditsAwarded} credits deposited into your account</div>
                    ) : (
                      <div>Swap completed successfully</div>
                    )}
                    <a
                      href={`https://solscan.io/tx/${result.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 underline"
                    >
                      View transaction →
                    </a>
                  </div>
                </div>,
                {
                  duration: 8000, // Show for 8 seconds to give time to read
                },
              )
            } else {
              console.warn("[v0] Purchase recording failed:", purchaseResult.error || "Unknown error")
              toast.success(
                <div className="space-y-2">
                  <div className="font-semibold">Swap Completed!</div>
                  <div className="text-sm">
                    <div>Transaction successful, but credit recording failed</div>
                    <a
                      href={`https://solscan.io/tx/${result.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 underline"
                    >
                      View transaction →
                    </a>
                  </div>
                </div>,
                {
                  duration: 6000,
                },
              )
            }
          } catch (error) {
            console.error("[v0] Error recording purchase:", error)
            toast.success(
              <div className="space-y-2">
                <div className="font-semibold">Swap Completed!</div>
                <div className="text-sm">
                  <div>Transaction successful</div>
                  <a
                    href={`https://solscan.io/tx/${result.signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 underline"
                  >
                    View transaction →
                  </a>
                </div>
              </div>,
              {
                duration: 6000,
              },
            )
          }
        } else {
          toast.success(
            <div className="space-y-2">
              <div className="font-semibold">Swap Completed!</div>
              <div className="text-sm">
                <a
                  href={`https://solscan.io/tx/${result.signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 underline"
                >
                  View transaction →
                </a>
              </div>
            </div>,
            {
              duration: 6000,
            },
          )
        }

        onSwapSuccess?.(result.signature, tokenAmount, solAmountUsed)

        // Reset form
        setSolAmount("0.01")
        setQuote(null)
      } else {
        throw new Error(result.error || "Swap failed")
      }
    } catch (error) {
      console.error("[v0] Swap error:", error)

      let errorMessage = "Swap failed"
      if (error instanceof Error) {
        if (error.message.includes("not been authorized") || error.message.includes("WalletSignTransactionError")) {
          errorMessage = "Transaction was rejected by wallet. Please try again and approve the transaction."
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient SOL balance for this transaction"
        } else if (error.message.includes("blockhash not found")) {
          errorMessage = "Transaction expired. Please try again."
        } else {
          errorMessage = error.message
        }
      }

      toast.error(errorMessage)
      onSwapError?.(errorMessage)
    } finally {
      setIsSwapping(false)
    }
  }

  if (!connected || connecting) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            {connecting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                Connecting wallet...
              </div>
            ) : (
              "Please connect your wallet to use the swap feature"
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Swap SOL for $AURA</CardTitle>
        <CardDescription>Exchange Solana for AURA tokens to earn credits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="sol-amount">SOL Amount</Label>
          <Input
            id="sol-amount"
            type="number"
            step="0.001"
            min="0.001"
            value={solAmount}
            onChange={(e) => setSolAmount(e.target.value)}
            placeholder="0.01"
            className="w-full"
          />
          {isGettingQuote && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
              Getting quote...
            </div>
          )}
        </div>

        {quote && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>You pay:</span>
              <span>{jupiterAPI.lamportsToSol(Number.parseInt(quote.inAmount)).toFixed(6)} SOL</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>You receive:</span>
              <span>
                {(Number.parseInt(quote.outAmount) / Math.pow(10, 9)).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}{" "}
                $AURA
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Credits earned:</span>
              <span>{jupiterAPI.calculateCreditsFromTokens(Number.parseInt(quote.outAmount) / Math.pow(10, 9))}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Price impact:</span>
              <span>{Number.parseFloat(quote.priceImpactPct).toFixed(2)}%</span>
            </div>
          </div>
        )}

        <Button onClick={handleSwap} disabled={isSwapping || !quote} className="w-full" size="lg">
          {isSwapping ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              Swapping...
            </>
          ) : (
            "Swap Now"
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">You'll receive 5 credits per 100k tokens purchased</p>
      </CardContent>
    </Card>
  )
}

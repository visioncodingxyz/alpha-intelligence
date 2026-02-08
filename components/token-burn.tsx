"use client"

import { useState, useCallback, useEffect } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { jupiterAPI } from "@/lib/jupiter-api"

interface TokenBurnProps {
  onBurnSuccess?: (txid: string, tokenAmount: number, creditsEarned: number) => void
  onBurnError?: (error: string) => void
}

export function TokenBurn({ onBurnSuccess, onBurnError }: TokenBurnProps) {
  const { connected, publicKey, signTransaction, wallet, connecting } = useWallet()
  const { connection } = useConnection()
  const [tokenAmount, setTokenAmount] = useState("100000")
  const [isBurning, setIsBurning] = useState(false)
  const [quote, setQuote] = useState<any>(null)
  const [isGettingQuote, setIsGettingQuote] = useState(false)

  const getQuote = useCallback(async () => {
    if (!tokenAmount || Number.parseFloat(tokenAmount) <= 0) {
      setQuote(null)
      return
    }

    // For burning, we don't need a quote - tokens are simply destroyed
    const burnAmount = Number.parseFloat(tokenAmount)
    const creditsEarned = Math.floor(burnAmount / 100000) * 3

    setQuote({
      inputAmount: burnAmount,
      outputAmount: 0, // No SOL received for actual burning
      creditsEarned,
      priceImpact: "0", // No price impact for burning
    })

    console.log("[v0] Burn preview updated:", {
      inputAURA: burnAmount,
      creditsEarned,
    })
  }, [tokenAmount])

  useEffect(() => {
    if (!connected || !tokenAmount || Number.parseFloat(tokenAmount) <= 0) {
      setQuote(null)
      return
    }

    const timeoutId = setTimeout(() => {
      getQuote()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [tokenAmount, connected, getQuote])

  const handleBurn = async () => {
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

    const tokenAmountNum = Number.parseFloat(tokenAmount)
    if (tokenAmountNum <= 0 || tokenAmountNum < 1000) {
      toast.error("Minimum burn amount is 1,000 tokens")
      return
    }

    setIsBurning(true)
    try {
      console.log("[v0] Starting token burn:", {
        connected,
        publicKey: publicKey.toString(),
        walletName: wallet.adapter.name,
        tokenAmount: tokenAmountNum,
      })

      const result = await jupiterAPI.burnAURATokens(tokenAmountNum, publicKey, signTransaction, 100)

      if (result.success && result.signature) {
        const creditsEarned = quote.creditsEarned

        console.log("[v0] Recording token burn", {
          walletAddress: publicKey.toString(),
          transactionSignature: result.signature,
          tokenAmount: tokenAmountNum,
          creditsEarned,
        })

        try {
          const response = await fetch("/api/token-burn", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              walletAddress: publicKey.toString(),
              transactionSignature: result.signature,
              tokenAmount: tokenAmountNum,
            }),
          })

          const burnResult = await response.json()

          if (response.ok && burnResult.success) {
            console.log("[v0] Burn completed:", {
              txid: result.signature,
              tokenAmount: tokenAmountNum,
              creditsEarned,
            })
            console.log("[v0] Credits earned from burn:", creditsEarned)

            toast.success(
              <div className="space-y-2">
                <div className="font-semibold">Burn Successful!</div>
                <div className="text-sm">
                  {creditsEarned ? (
                    <div>{creditsEarned} credits deposited into your account</div>
                  ) : (
                    <div>Burn completed successfully</div>
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
                duration: 8000,
              },
            )
          } else {
            console.warn("[v0] Burn recording failed:", burnResult.error || "Unknown error")
            toast.success(
              <div className="space-y-2">
                <div className="font-semibold">Burn Completed!</div>
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
          console.error("[v0] Error recording burn:", error)
          toast.success(
            <div className="space-y-2">
              <div className="font-semibold">Burn Completed!</div>
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

        onBurnSuccess?.(result.signature, tokenAmountNum, creditsEarned)

        // Reset form
        setTokenAmount("100000")
        setQuote(null)
      } else {
        throw new Error(result.error || "Burn failed")
      }
    } catch (error) {
      console.error("[v0] Burn error:", error)

      let errorMessage = "Burn failed"
      if (error instanceof Error) {
        if (error.message.includes("not been authorized") || error.message.includes("WalletSignTransactionError")) {
          errorMessage = "Transaction was rejected by wallet. Please try again and approve the transaction."
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient token balance for this transaction"
        } else if (error.message.includes("blockhash not found")) {
          errorMessage = "Transaction expired. Please try again."
        } else {
          errorMessage = error.message
        }
      }

      toast.error(errorMessage)
      onBurnError?.(errorMessage)
    } finally {
      setIsBurning(false)
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
              "Please connect your wallet to use the burn feature"
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Burn Tokens</CardTitle>
        <CardDescription>Burn $AURA tokens to earn credits</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="token-amount">Token Amount</Label>
          <Input
            id="token-amount"
            type="number"
            step="1000"
            min="1000"
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
            placeholder="100000"
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
              <span>You burn:</span>
              <span>
                {Number.parseFloat(tokenAmount).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}{" "}
                $AURA
              </span>
            </div>
            <div className="flex justify-between text-sm text-red-500">
              <span>Tokens destroyed:</span>
              <span>
                {Number.parseFloat(tokenAmount).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}{" "}
                $AURA (permanent)
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Credits earned:</span>
              <span>{quote.creditsEarned}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-2 border-yellow-400">
              ⚠️ Burning permanently destroys tokens - they cannot be recovered
            </div>
          </div>
        )}

        <Button onClick={handleBurn} disabled={true} className="w-full" size="lg">
          {isBurning ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              Burning...
            </>
          ) : (
            "Burn Tokens"
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Burning permanently destroys tokens and awards 3 credits per 100k tokens
        </p>
      </CardContent>
    </Card>
  )
}

"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Wallet } from "lucide-react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js"

interface GetCreditsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GetCreditsModal({ open, onOpenChange }: GetCreditsModalProps) {
  const { publicKey, connected, sendTransaction } = useWallet()
  const { connection } = useConnection()
  const { setVisible } = useWalletModal()

  const [showPurchaseFlow, setShowPurchaseFlow] = useState(false)
  const [creditAmount, setCreditAmount] = useState(100)
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [shouldReopenAfterConnection, setShouldReopenAfterConnection] = useState(false)

  const CREDIT_PRICE_SOL = 0.002
  const PAYMENT_ADDRESS = "BDsfm2N3RLhD1MpuFPpKJVrY6W7ZCEtaNkXAioGaVket"

  useEffect(() => {
    if (connected && shouldReopenAfterConnection) {
      onOpenChange(true)
      setShouldReopenAfterConnection(false)
    }
  }, [connected, shouldReopenAfterConnection, onOpenChange])

  useEffect(() => {
    if (!open) {
      setShowPurchaseFlow(false)
      setCreditAmount(100)
    }
  }, [open])

  const handleConnectWallet = async () => {
    setShouldReopenAfterConnection(true)
    onOpenChange(false)
    setVisible(true)
  }

  const handleBuyCredits = () => {
    setShowPurchaseFlow(true)
  }

  const handleBack = () => {
    setShowPurchaseFlow(false)
  }

  const totalSOL = (creditAmount * CREDIT_PRICE_SOL).toFixed(4)

  const handlePurchase = async () => {
    if (!publicKey) {
      toast.error("Wallet not connected")
      return
    }

    setIsPurchasing(true)

    try {
      const lamports = Math.floor(Number.parseFloat(totalSOL) * LAMPORTS_PER_SOL)

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(PAYMENT_ADDRESS),
          lamports: lamports,
        }),
      )

      toast.info("Please approve the transaction in your wallet...")

      const signature = await sendTransaction(transaction, connection)

      toast.info("Transaction sent! Waiting for confirmation...")

      await connection.confirmTransaction(signature, "confirmed")

      const solAmountInLamports = Math.floor(Number.parseFloat(totalSOL) * LAMPORTS_PER_SOL)

      const response = await fetch("/api/token-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toString(),
          transactionSignature: signature,
          tokenAmount: creditAmount,
          solAmount: solAmountInLamports, // Send lamports instead of decimal SOL
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to record purchase")
      }

      const result = await response.json()

      toast.success(`Successfully purchased ${creditAmount} credits!`)

      // Dispatch event to update credit displays across the app
      window.dispatchEvent(new Event("creditsUpdated"))

      // Wait a moment for the user to see the success message, then close modal
      setTimeout(() => {
        onOpenChange(false)
        setShowPurchaseFlow(false)
        setCreditAmount(100)
      }, 2000)
    } catch (error: any) {
      console.error("[v0] Error purchasing credits:", error)
      if (error.message?.includes("User rejected")) {
        toast.error("Transaction cancelled")
      } else {
        toast.error(`Failed to purchase credits: ${error.message || "Unknown error"}`)
      }
    } finally {
      setIsPurchasing(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-sm w-full fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-[9999] bg-background border shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-mono uppercase tracking-wide">
            {showPurchaseFlow ? "Purchase Credits" : "Get Credits"}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground font-mono">
            {!showPurchaseFlow && !connected && "Connect your wallet to purchase credits"}
            {!showPurchaseFlow && connected && "Purchase credits to generate images"}
            {showPurchaseFlow && "Select the number of credits you want to purchase"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!showPurchaseFlow ? (
            <>
              {!connected ? (
                <div className="space-y-3">
                  <Button
                    onClick={handleConnectWallet}
                    className="w-full h-12 text-base font-mono uppercase"
                    variant="default"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center text-sm text-muted-foreground font-mono">
                    Connected: {formatAddress(publicKey!.toString())}
                  </div>
                  <Button
                    onClick={handleBuyCredits}
                    className="w-full h-12 text-base font-mono uppercase"
                    variant="default"
                  >
                    💰 Buy Credits
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <button
                onClick={handleBack}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 font-mono"
              >
                ← Back
              </button>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-mono text-muted-foreground">Credits Amount</label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={creditAmount}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value) || 1
                      setCreditAmount(Math.min(Math.max(value, 1), 1000))
                    }}
                    className="text-center text-lg font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Slider
                    value={[creditAmount]}
                    onValueChange={(value) => setCreditAmount(value[0])}
                    min={1}
                    max={1000}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground font-mono">
                    <span>1</span>
                    <span>1000</span>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm font-mono">
                    <span className="text-muted-foreground">Credits:</span>
                    <span className="font-semibold">{creditAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm font-mono">
                    <span className="text-muted-foreground">Price per credit:</span>
                    <span>{CREDIT_PRICE_SOL} SOL</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between text-base font-mono font-semibold">
                    <span>Total:</span>
                    <span>{totalSOL} SOL</span>
                  </div>
                </div>

                <Button
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                  className="w-full h-12 text-base font-mono uppercase"
                  variant="default"
                >
                  {isPurchasing ? "Processing..." : "Purchase"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

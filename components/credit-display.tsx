"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditManager } from "@/lib/credit-system"
import { useWallet } from "@solana/wallet-adapter-react"
import { GetCreditsModal } from "./get-credits-modal"

export function CreditDisplay() {
  const { publicKey, connected } = useWallet()
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showCreditsModal, setShowCreditsModal] = useState(false)

  useEffect(() => {
    const updateCredits = async () => {
      setLoading(true)
      try {
        if (connected && publicKey) {
          const address = publicKey.toString()
          console.log("[v0] CREDIT DISPLAY - Fetching credits from database for wallet:", address)
          const response = await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress: address, action: "getOrCreate" }),
          })

          if (response.ok) {
            const { user } = await response.json()
            console.log("[v0] CREDIT DISPLAY - Database credits:", user.credit_balance)
            setCredits(user.credit_balance)
          } else {
            console.error("[v0] CREDIT DISPLAY - Failed to fetch database credits, falling back to localStorage")
            const localCredits = await CreditManager.getCredits()
            console.log("[v0] CREDIT DISPLAY - Fallback localStorage credits:", localCredits)
            setCredits(localCredits)
          }
        } else {
          // Get credits from localStorage for non-connected users
          const currentCredits = await CreditManager.getCredits()
          console.log("[v0] CREDIT DISPLAY - LocalStorage credits:", currentCredits)
          setCredits(currentCredits)
        }
      } catch (error) {
        console.error("[v0] CREDIT DISPLAY - Error updating credits:", error)
        try {
          const localCredits = await CreditManager.getCredits()
          console.log("[v0] CREDIT DISPLAY - Error fallback to localStorage credits:", localCredits)
          setCredits(localCredits)
        } catch (fallbackError) {
          console.error("[v0] CREDIT DISPLAY - Fallback also failed:", fallbackError)
          setCredits(0)
        }
      } finally {
        setLoading(false)
      }
    }

    updateCredits()

    const handleCreditUpdate = () => {
      console.log("[v0] CREDIT DISPLAY - creditsUpdated event received")
      updateCredits()
    }
    window.addEventListener("creditsUpdated", handleCreditUpdate)

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "nsfw-ai-credits") {
        console.log("[v0] CREDIT DISPLAY - localStorage change detected")
        updateCredits()
      }
    }
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("creditsUpdated", handleCreditUpdate)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [connected, publicKey])

  if (loading) {
    return (
      <Badge
        variant="secondary"
        className="font-mono text-xs flex items-center gap-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      >
        LOADING...
      </Badge>
    )
  }

  // Show credits for both connected and non-connected users
  if (credits === 0) {
    return (
      <>
        <Button
          onClick={() => setShowCreditsModal(true)}
          variant="secondary"
          size="sm"
          className="font-mono text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30"
        >
          GET CREDITS
        </Button>

        <GetCreditsModal open={showCreditsModal} onOpenChange={setShowCreditsModal} />
      </>
    )
  }

  return (
    <Badge
      variant="secondary"
      className="font-mono text-xs flex items-center gap-1 bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    >
      {credits} CREDITS
    </Badge>
  )
}

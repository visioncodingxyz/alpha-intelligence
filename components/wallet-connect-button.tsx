"use client"

import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import { useWallet } from "@solana/wallet-adapter-react"
import { useWalletModal } from "@solana/wallet-adapter-react-ui"
import { useEffect } from "react"

interface WalletConnectButtonProps {
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function WalletConnectButton({ className, variant = "ghost", size = "sm" }: WalletConnectButtonProps) {
  const { publicKey, disconnect, connected } = useWallet()
  const { setVisible } = useWalletModal()

  // Trigger credit refresh when wallet connection changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("creditsUpdated"))
    }
  }, [connected, publicKey])

  const handleConnect = () => {
    setVisible(true)
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (connected && publicKey) {
    return (
      <Button
        onClick={handleDisconnect}
        variant={variant}
        size={size}
        className={`font-mono uppercase text-xs border-none outline-none focus:outline-none ${className}`}
      >
        <Wallet className="w-4 h-4 mr-2" />
        {formatAddress(publicKey.toString())}
      </Button>
    )
  }

  return (
    <Button
      onClick={handleConnect}
      variant={variant}
      size={size}
      className={`font-mono uppercase text-xs border-none outline-none focus:outline-none ${className}`}
    >
      <Wallet className="w-4 h-4 mr-2" />
      CONNECT WALLET
    </Button>
  )
}

"use client"

import type React from "react"
import { Header } from "@/components/header"
import { ContractAddressBar } from "@/components/contract-address-bar"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { usePathname } from "next/navigation"
import { WalletContextProvider } from "@/components/wallet-provider"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isFullScreenPage =
    pathname === "/chat" ||
    pathname === "/create" ||
    pathname === "/gallery" ||
    pathname === "/docs" ||
    pathname === "/whitepaper" ||
    pathname === "/admin" ||
    pathname === "/launchpad" ||
    pathname === "/launch" ||
    pathname === "/rewards" ||
    pathname === "/mint-nft"

  return (
    <WalletContextProvider>
      {!isFullScreenPage && <Header />}
      {children}
      {!isFullScreenPage && <ContractAddressBar />}
      <Toaster />
      <SonnerToaster position="top-right" expand={true} richColors={true} closeButton={true} />
    </WalletContextProvider>
  )
}

export default ClientLayout

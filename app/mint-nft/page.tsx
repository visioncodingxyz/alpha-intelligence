"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Sparkles, Home, AlertCircle, ImageIcon, ExternalLink, Copy, CheckCircle } from "lucide-react"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { CreditDisplay } from "@/components/credit-display"
import { CreditManager } from "@/components/credit-system"
import { useWallet } from "@solana/wallet-adapter-react"
import Link from "next/link"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const COLLECTION_ID = "9523194f-0a1f-43dc-a650-d65e0874df4a"
const MINT_COST = 4 // 4 credits per NFT mint

export default function MintNFTPage() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [prompt, setPrompt] = useState("")
  const [style, setStyle] = useState("digital-art")
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isMinting, setIsMinting] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState("")
  const [credits, setCredits] = useState(0)
  const [loading, setLoading] = useState(false)
  const [mintedNFT, setMintedNFT] = useState<any>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [mintSuccess, setMintSuccess] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const { publicKey, connected } = useWallet()

  useEffect(() => {
    const updateCredits = async () => {
      setLoading(true)
      try {
        if (connected && publicKey) {
          const address = publicKey.toString()
          const response = await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress: address, action: "getOrCreate" }),
          })

          if (response.ok) {
            const { user } = await response.json()
            setCredits(user.credit_balance)
          } else {
            setCredits(0)
          }
        } else {
          const currentCredits = await CreditManager.getCredits()
          setCredits(currentCredits)
        }
      } catch (error) {
        console.error("[v0] Error updating credits:", error)
        setCredits(0)
      } finally {
        setLoading(false)
      }
    }

    updateCredits()

    const handleCreditsUpdate = () => {
      updateCredits()
    }

    window.addEventListener("creditsUpdated", handleCreditsUpdate)

    return () => {
      window.removeEventListener("creditsUpdated", handleCreditsUpdate)
    }
  }, [connected, publicKey])

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt for the NFT image")
      return
    }

    setIsGeneratingImage(true)

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }

      if (connected && publicKey) {
        headers["x-wallet-address"] = publicKey.toString()
      }

      const response = await fetch("/api/generate-nft-image", {
        method: "POST",
        headers,
        body: JSON.stringify({
          prompt,
          style,
          nsfwMode: false,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate image")
      }

      setGeneratedImageUrl(data.imageUrl)
      toast.success("Image generated successfully!")

      if (connected && publicKey) {
        const newCredits = await CreditManager.getCredits(publicKey.toString())
        setCredits(newCredits)
        window.dispatchEvent(new Event("creditsUpdated"))
      }
    } catch (error) {
      console.error("Error generating image:", error)
      toast.error(error instanceof Error ? error.message : "Failed to generate image")
    } finally {
      setIsGeneratingImage(false)
    }
  }

  const handleMintNFT = async () => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet to mint NFTs")
      return
    }

    if (!name.trim()) {
      toast.error("Please enter a name for your NFT")
      return
    }

    if (!generatedImageUrl) {
      toast.error("Please generate an image first")
      return
    }

    if (credits < MINT_COST) {
      toast.error(`Insufficient credits. You need ${MINT_COST} credits to mint an NFT.`)
      return
    }

    setIsMinting(true)
    setMintSuccess(false)

    try {
      const walletAddress = publicKey.toString()

      const response = await fetch("/api/mint-nft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": walletAddress,
        },
        body: JSON.stringify({
          name,
          description,
          imageUrl: generatedImageUrl,
          walletAddress,
          nsfwMode: false,
          collectionId: COLLECTION_ID,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to mint NFT")
      }

      setMintedNFT(data)
      toast.success("NFT minting started! Checking status...")

      const newCredits = await CreditManager.getCredits(walletAddress)
      setCredits(newCredits)
      window.dispatchEvent(new Event("creditsUpdated"))

      checkMintStatus(data.actionId)
    } catch (error) {
      console.error("Error minting NFT:", error)
      toast.error(error instanceof Error ? error.message : "Failed to mint NFT")
      setIsMinting(false)
    }
  }

  const checkMintStatus = async (actionId: string) => {
    setCheckingStatus(true)
    let attempts = 0
    const maxAttempts = 30

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/check-mint-status?actionId=${actionId}`)
        const result = await response.json()

        console.log("[v0] Mint status check result:", result)

        if (result.status === "succeeded") {
          setCheckingStatus(false)
          setIsMinting(false)
          setMintSuccess(true)

          const nftAddress =
            result.nftAddress ||
            result.data?.nft?.onChain?.mintHash ||
            result.data?.nft?.onChain?.address ||
            result.data?.nft?.address

          console.log("[v0] NFT Address extracted:", nftAddress)

          if (nftAddress) {
            setMintedNFT((prev: any) => ({
              ...prev,
              nftAddress: nftAddress,
              txHash: nftAddress,
            }))
          } else {
            console.log("[v0] No NFT address found in response. Full data:", result.data)
          }

          toast.success("NFT minted successfully!")
          return true
        } else if (result.status === "failed") {
          toast.error("NFT minting failed")
          setCheckingStatus(false)
          setIsMinting(false)
          return true
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000)
        } else {
          toast.info("Mint is taking longer than expected. Check back later.")
          setCheckingStatus(false)
          setIsMinting(false)
        }
      } catch (error) {
        console.error("Error checking mint status:", error)
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 10000)
        } else {
          setCheckingStatus(false)
          setIsMinting(false)
        }
      }
    }

    checkStatus()
  }

  const handleReset = () => {
    setName("")
    setDescription("")
    setPrompt("")
    setGeneratedImageUrl("")
    setMintedNFT(null)
    setMintSuccess(false)
    setShowSuccessDialog(false)
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success("Copied to clipboard!")
    setTimeout(() => setCopiedField(null), 2000)
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col lg:flex-row overflow-hidden">
      <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-border bg-background/50 backdrop-blur-sm flex flex-col h-screen lg:h-full">
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-border/30 flex-shrink-0 h-auto lg:h-[73px]">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="text-base sm:text-lg font-mono uppercase tracking-wide flex items-center gap-2 text-yellow-500">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              MINT NFT
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-mono uppercase mb-2 block tracking-wide">NFT Name</label>
                <Input
                  placeholder="Enter NFT name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background/50 border-border/50 font-mono text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="text-xs sm:text-sm font-mono uppercase mb-2 block tracking-wide">
                  Description (Optional)
                </label>
                <Textarea
                  placeholder="Enter NFT description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[60px] resize-none bg-background/50 border-border/50 font-mono text-xs sm:text-sm"
                />
              </div>

              <div className="border-t border-border/30 pt-4">
                <h3 className="text-xs sm:text-sm font-mono uppercase mb-3 tracking-wide text-primary">
                  Generate NFT Image
                </h3>

                <div className="mb-3">
                  <label className="text-xs sm:text-sm font-mono uppercase mb-2 block tracking-wide">
                    Image Prompt
                  </label>
                  <Textarea
                    placeholder="Describe the image for your NFT..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[60px] resize-none bg-background/50 border-border/50 font-mono text-xs sm:text-sm"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-xs sm:text-sm font-mono uppercase mb-2 block tracking-wide">Style</label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="bg-background/50 border-border/50 h-9 text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="realistic">Realistic</SelectItem>
                      <SelectItem value="digital-art">Digital Art</SelectItem>
                      <SelectItem value="anime">Anime</SelectItem>
                      <SelectItem value="oil-painting">Oil Painting</SelectItem>
                      <SelectItem value="cyberpunk">Cyberpunk</SelectItem>
                      <SelectItem value="fantasy">Fantasy</SelectItem>
                      <SelectItem value="abstract">Abstract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleGenerateImage}
                  disabled={!prompt.trim() || isGeneratingImage}
                  className="w-full font-mono uppercase text-xs h-9 bg-transparent"
                  variant="outline"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      GENERATING...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3 h-3 mr-2" />
                      GENERATE IMAGE (1 CREDIT)
                    </>
                  )}
                </Button>
              </div>

              {credits < MINT_COST && (
                <div className="flex items-center gap-2 p-2 sm:p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs font-mono">
                    Insufficient credits. You need {MINT_COST} credits to mint an NFT.
                  </span>
                </div>
              )}

              <div className="p-2 sm:p-3 bg-primary/10 border border-primary/20 rounded">
                <p className="text-xs font-mono text-primary">Minting Cost: {MINT_COST} credits per NFT</p>
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="p-3 sm:p-4 bg-background/95 backdrop-blur-sm border-t border-border/30 flex-shrink-0">
          <Button
            onClick={handleMintNFT}
            disabled={!connected || !name.trim() || !generatedImageUrl || isMinting || credits < MINT_COST}
            className="w-full font-mono uppercase text-xs sm:text-sm h-10 sm:h-12"
          >
            {isMinting ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                MINTING NFT...
              </>
            ) : (
              `MINT NFT (${MINT_COST} CREDITS)`
            )}
          </Button>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 flex-col h-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 border-b border-border/30 flex-shrink-0 h-auto lg:h-[73px] gap-2 sm:gap-0">
          <h3 className="text-base sm:text-lg font-mono uppercase tracking-wide">NFT PREVIEW</h3>
          <div className="flex gap-2 items-center flex-wrap">
            <CreditDisplay />
            <WalletConnectButton />
            <Link href="/">
              <Button variant="ghost" size="sm" className="font-mono uppercase text-xs">
                <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                HOME
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex items-center justify-center p-6">
          {generatedImageUrl ? (
            <div className="max-w-sm w-full space-y-4">
              <div
                className="aspect-square overflow-hidden bg-foreground/5 border border-border/50"
                style={{
                  clipPath:
                    "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
                }}
              >
                <img
                  src={generatedImageUrl || "/placeholder.svg"}
                  alt="NFT Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {name && (
                <div className="space-y-2">
                  <h4 className="text-xl font-mono uppercase text-primary">{name}</h4>
                  {description && <p className="text-sm font-mono text-foreground/60">{description}</p>}
                </div>
              )}

              {mintedNFT && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded space-y-2">
                  <p className="text-sm font-mono text-green-400">
                    {mintSuccess ? "Mint Successful!" : "Minting in progress..."}
                  </p>
                  {mintSuccess && mintedNFT.nftAddress ? (
                    <div className="space-y-1">
                      <label className="text-xs font-mono uppercase text-foreground/60">Mint Address</label>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono text-foreground/80 break-all flex-1">{mintedNFT.nftAddress}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(mintedNFT.nftAddress, "contract")}
                          className="h-8 w-8 p-0"
                        >
                          {copiedField === "contract" ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    mintedNFT.crossmintId && (
                      <p className="text-xs font-mono text-foreground/80">Mint ID: {mintedNFT.crossmintId}</p>
                    )
                  )}
                  {mintSuccess && mintedNFT.nftAddress ? (
                    <Button variant="outline" size="sm" asChild className="w-full font-mono uppercase bg-transparent">
                      <a
                        href={`https://solscan.io/token/${mintedNFT.nftAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        VIEW ON SOLSCAN
                      </a>
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6">
              <div
                className="w-20 h-20 mb-6 bg-primary/20 flex items-center justify-center"
                style={{
                  clipPath:
                    "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
                }}
              >
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-mono uppercase mb-4">MINT YOUR NFT</h3>
              <p className="text-foreground/60 font-mono text-sm max-w-md">
                Generate an image and mint it as an NFT on Solana. Your NFT will be added to the collection.
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md bg-background border-primary/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-mono uppercase text-primary">
              <CheckCircle className="w-6 h-6 text-green-500" />
              NFT MINTED SUCCESSFULLY!
            </DialogTitle>
            <DialogDescription className="font-mono text-sm text-foreground/60">
              Your NFT has been successfully minted to the Solana blockchain.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-1">
              <label className="text-xs font-mono uppercase text-foreground/60">NFT Name</label>
              <p className="text-sm font-mono text-foreground">{name}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono uppercase text-foreground/60">Collection ID</label>
              <div className="flex items-center gap-2">
                <p className="text-xs font-mono text-foreground/80 break-all flex-1">{COLLECTION_ID}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(COLLECTION_ID, "collection")}
                  className="h-8 w-8 p-0"
                >
                  {copiedField === "collection" ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {mintedNFT?.nftAddress && (
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-foreground/60">NFT Contract Address</label>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono text-foreground/80 break-all flex-1">{mintedNFT.nftAddress}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(mintedNFT.nftAddress, "contract")}
                    className="h-8 w-8 p-0"
                  >
                    {copiedField === "contract" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                    <a
                      href={`https://solscan.io/token/${mintedNFT.nftAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {mintedNFT?.crossmintId && (
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-foreground/60">Crossmint ID</label>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono text-foreground/80 break-all flex-1">{mintedNFT.crossmintId}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(mintedNFT.crossmintId, "crossmint")}
                    className="h-8 w-8 p-0"
                  >
                    {copiedField === "crossmint" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {mintedNFT?.actionId && (
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-foreground/60">Action ID</label>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono text-foreground/80 break-all flex-1">{mintedNFT.actionId}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(mintedNFT.actionId, "action")}
                    className="h-8 w-8 p-0"
                  >
                    {copiedField === "action" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {mintedNFT?.txHash && (
              <div className="space-y-1">
                <label className="text-xs font-mono uppercase text-foreground/60">Transaction Hash</label>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-mono text-foreground/80 break-all flex-1">{mintedNFT.txHash}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(mintedNFT.txHash, "tx")}
                    className="h-8 w-8 p-0"
                  >
                    {copiedField === "tx" ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                    <a href={`https://solscan.io/tx/${mintedNFT.txHash}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={handleReset} className="flex-1 font-mono uppercase text-xs">
                MINT ANOTHER NFT
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSuccessDialog(false)}
                className="flex-1 font-mono uppercase text-xs bg-transparent"
              >
                CLOSE
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

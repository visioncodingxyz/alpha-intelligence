"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Sparkles } from "lucide-react"
import { CreditManager } from "@/lib/credit-system"

interface AIGenerationModalProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (data: {
    name: string
    symbol: string
    description: string
    imageUrl: string
    nsfwMode: boolean
  }) => void
  walletAddress?: string
}

export function AIGenerationModal({ isOpen, onClose, onGenerate, walletAddress }: AIGenerationModalProps) {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState("")
  const [nsfwMode, setNsfwMode] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt")
      return
    }

    const canAfford = await CreditManager.canAfford("Ultra", walletAddress)
    if (!canAfford) {
      alert("Insufficient credits. You need 1 credit to generate a token.")
      return
    }

    setIsGenerating(true)

    try {
      const creditDeducted = await CreditManager.deductCredits("Ultra", walletAddress)
      if (!creditDeducted) {
        throw new Error("Failed to deduct credits")
      }

      // Dispatch event to update credit display
      window.dispatchEvent(new Event("creditsUpdated"))

      // Step 1: Generate token details
      setGenerationStep("Generating token details...")
      const detailsResponse = await fetch("/api/generate-token-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: prompt.trim(), nsfwMode }),
      })

      const detailsData = await detailsResponse.json()

      if (!detailsResponse.ok) {
        if (detailsResponse.status === 429) {
          throw new Error("AI service is currently busy due to high demand. Please wait a moment and try again.")
        } else if (detailsResponse.status === 503) {
          throw new Error("AI service is temporarily unavailable. Please try again in a few minutes.")
        } else {
          throw new Error(detailsData.message || "Failed to generate token details")
        }
      }

      // Step 2: Generate token image
      setGenerationStep("Generating token image...")
      const imageEndpoint = "/api/generate-token-image"

      const imageRequestBody = { prompt: prompt.trim(), nsfwMode }

      const imageResponse = await fetch(imageEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(imageRequestBody),
      })

      const imageData = await imageResponse.json()

      if (!imageResponse.ok) {
        if (imageResponse.status === 429) {
          throw new Error("Image generation service is currently busy. Please wait a moment and try again.")
        } else {
          throw new Error(imageData.message || "Failed to generate token image")
        }
      }

      // Combine the results
      const generatedData = {
        name: detailsData.tokenDetails.name,
        symbol: detailsData.tokenDetails.symbol,
        description: detailsData.tokenDetails.description,
        imageUrl: imageData.imageUrl,
        nsfwMode: nsfwMode,
      }

      onGenerate(generatedData)
      onClose()
      setPrompt("")
      setNsfwMode(false)
    } catch (error) {
      console.error("[v0] AI generation error:", error)

      const errorMessage = error instanceof Error ? error.message : "Failed to generate token"
      alert(errorMessage)

      if (walletAddress) {
        await CreditManager.addCredits(1, walletAddress)
      } else {
        const { credits } = CreditManager.getLocalCredits()
        CreditManager.updateLocalCredits(credits + 1)
      }
      // Dispatch event to update credit display
      window.dispatchEvent(new Event("creditsUpdated"))
    } finally {
      setIsGenerating(false)
      setGenerationStep("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase text-yellow-500 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI TOKEN GENERATOR
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <label className="text-xs font-mono uppercase mb-2 block tracking-wide">Describe your token concept</label>
            <div className="absolute -top-3 right-0 z-10">
              <div className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-mono font-bold">
                1 CREDIT
              </div>
            </div>
            <Textarea
              placeholder="e.g., A token called Liberty Coin rewarding in USD1..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] resize-none bg-black/50 border-gray-700/50 font-mono text-sm"
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-400 mt-1 font-mono">
              Be specific about the theme, style, and target audience
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-700/50 rounded">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={nsfwMode}
                onChange={(e) => setNsfwMode(e.target.checked)}
                className="w-4 h-4 text-yellow-500 bg-gray-900 border-gray-600 rounded focus:ring-yellow-500 focus:ring-2"
                disabled={isGenerating}
              />
              <span className="font-mono uppercase text-sm tracking-wide text-yellow-500">NSFW MODE</span>
            </label>
            <div className="text-xs text-gray-400 font-mono">
              {nsfwMode ? "ADULT CONTENT ENABLED" : "SAFE CONTENT ONLY"}
            </div>
          </div>

          {isGenerating && (
            <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-400">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <span className="text-xs font-mono">{generationStep}</span>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full font-mono uppercase text-sm"
          >
            [GENERATE TOKEN]
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

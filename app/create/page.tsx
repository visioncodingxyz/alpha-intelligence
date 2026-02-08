"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useIsMobile } from "@/components/ui/use-mobile"
import { Loader2, Download, Sparkles, Home, AlertCircle, Camera, Video } from "lucide-react"
import { WalletConnectButton } from "@/components/wallet-connect-button"
import { CreditDisplay } from "@/components/credit-display"
import { CreditManager, type CREDIT_COSTS } from "@/lib/credit-system"
import { ImageCacheManager, type CachedImage } from "@/lib/image-cache"
import { useWallet } from "@solana/wallet-adapter-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  timestamp: Date
}

interface GeneratedVideo {
  id: string
  url: string
  prompt: string
  timestamp: Date
}

type GenerationMode = "photo" | "video"

export default function CreatePage() {
  const searchParams = useSearchParams()

  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([])
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideo | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [credits, setCredits] = useState(0)
  const [generationMode, setGenerationMode] = useState<GenerationMode>("photo")
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const [isNsfwOpen, setIsNsfwOpen] = useState(false)
  const [videoQuality, setVideoQuality] = useState("Standard")
  const [videoAspect, setVideoAspect] = useState("Portrait")
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [quality, setQuality] = useState("Ultra")
  const [nsfwMode, setNsfwMode] = useState(false)

  const [style, setStyle] = useState("Cinematic")
  const [poses, setPoses] = useState("Default")
  const [filter, setFilter] = useState("Default")
  const [emotion, setEmotion] = useState("Default")
  const [imageSize, setImageSize] = useState("512x512")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [detail, setDetail] = useState([0])
  const [creativity, setCreativity] = useState([50])
  const [restoreFaces, setRestoreFaces] = useState(false)
  const [ageSlider, setAgeSlider] = useState([25])
  const [weightSlider, setWeightSlider] = useState([0])
  const [breastSlider, setBreastSlider] = useState([0])
  const [assSlider, setAssSlider] = useState([0])

  const { publicKey, connected } = useWallet()

  const isMobile = useIsMobile()
  const [showMobilePopup, setShowMobilePopup] = useState(false)
  const [latestGeneratedItem, setLatestGeneratedItem] = useState<GeneratedImage | GeneratedVideo | null>(null)

  useEffect(() => {
    const mode = searchParams.get("mode")
    if (mode === "video") {
      setGenerationMode("video")
    }
  }, [searchParams])

  useEffect(() => {
    const updateCredits = async () => {
      setLoading(true)
      try {
        console.log("[v0] CREATE PAGE - updateCredits called")
        console.log("[v0] CREATE PAGE - Wallet connected:", connected)
        console.log("[v0] CREATE PAGE - Wallet publicKey:", publicKey?.toString())

        if (connected && publicKey) {
          const address = publicKey.toString()
          console.log("[v0] CREATE PAGE - Fetching credits from database for wallet:", address)
          console.log("[v0] CREATE PAGE - Wallet address length:", address.length)

          const response = await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ walletAddress: address, action: "getOrCreate" }),
          })

          console.log("[v0] CREATE PAGE - API response status:", response.status)

          if (response.ok) {
            const { user } = await response.json()
            console.log("[v0] CREATE PAGE - Database credits fetched successfully:", {
              wallet: user.wallet_address,
              credits: user.credit_balance,
            })
            setCredits(user.credit_balance)
          } else {
            const errorText = await response.text()
            console.error("[v0] CREATE PAGE - Failed to fetch database credits:", {
              status: response.status,
              statusText: response.statusText,
              error: errorText,
            })
            console.log("[v0] CREATE PAGE - Setting credits to 0 due to API failure")
            setCredits(0)
          }
        } else {
          console.log("[v0] CREATE PAGE - Wallet disconnected, using localStorage credits")
          const currentCredits = await CreditManager.getCredits()
          console.log("[v0] CREATE PAGE - LocalStorage credits:", currentCredits)
          setCredits(currentCredits)
        }
      } catch (error) {
        console.error("[v0] CREATE PAGE - Error updating credits:", error)
        if (connected && publicKey) {
          console.log("[v0] CREATE PAGE - Setting credits to 0 due to error with connected wallet")
          setCredits(0)
        } else {
          const localCredits = await CreditManager.getCredits()
          console.log("[v0] CREATE PAGE - Error fallback to localStorage credits:", localCredits)
          setCredits(localCredits)
        }
      } finally {
        setLoading(false)
      }
    }

    updateCredits()

    const handleCreditsUpdate = () => {
      console.log("[v0] CREATE PAGE - Credits update event received")
      updateCredits()
    }

    window.addEventListener("creditsUpdated", handleCreditsUpdate)

    return () => {
      window.removeEventListener("creditsUpdated", handleCreditsUpdate)
    }
  }, [connected, publicKey])

  useEffect(() => {
    const loadCachedImages = () => {
      const cachedImages = ImageCacheManager.getCachedImages()
      const formattedImages: GeneratedImage[] = cachedImages.map((img) => ({
        id: img.id,
        url: img.url,
        prompt: img.prompt,
        timestamp: img.timestamp,
      }))
      setGeneratedImages(formattedImages)
      console.log("[v0] Loaded cached images:", formattedImages.length)
    }

    loadCachedImages()
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isModalOpen) {
        closeModal()
      }
    }

    if (isModalOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isModalOpen])

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    const walletAddress = connected && publicKey ? publicKey.toString() : undefined
    const qualityToCheck = generationMode === "photo" ? quality : videoQuality
    const isVideo = generationMode === "video"
    const cost = CreditManager.getCreditCost(qualityToCheck, isVideo)
    const canAfford = await CreditManager.canAfford(qualityToCheck, walletAddress, isVideo)

    if (!canAfford) {
      alert(`Insufficient credits for ${qualityToCheck} quality. Click "Get Credits" to keep generating.`)
      return
    }

    setIsGenerating(true)

    try {
      if (generationMode === "photo") {
        await handleImageGeneration(walletAddress)
      } else {
        await handleVideoGeneration(walletAddress)
      }
    } catch (error) {
      console.error("Error generating content:", error)
      alert(`Error: ${error instanceof Error ? error.message : "Failed to generate content"}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleImageGeneration = async (walletAddress?: string) => {
    console.log("[v0] CREATE PAGE - handleImageGeneration - Starting")
    console.log("[v0] CREATE PAGE - Wallet address:", walletAddress || "NOT PROVIDED")
    console.log("[v0] CREATE PAGE - NSFW mode:", nsfwMode)
    console.log("[v0] CREATE PAGE - Quality setting:", quality)

    if (!walletAddress) {
      const cost = CreditManager.getCreditCost(quality, false)
      console.log("[v0] CREATE PAGE - Credit cost for quality:", cost)
      const currentLocalCredits = CreditManager.getLocalCredits().credits
      console.log("[v0] CREATE PAGE - LocalStorage credits before deduction:", currentLocalCredits)

      if (currentLocalCredits < cost) {
        throw new Error(`Insufficient credits. You have ${currentLocalCredits} but need ${cost}.`)
      }

      const newCredits = currentLocalCredits - cost
      console.log("[v0] CREATE PAGE - Deducting", cost, "credits. New balance should be:", newCredits)
      CreditManager.updateLocalCredits(newCredits)
      const creditsAfterDeduction = CreditManager.getLocalCredits().credits
      console.log("[v0] CREATE PAGE - LocalStorage credits after deduction:", creditsAfterDeduction)
      setCredits(creditsAfterDeduction)
      window.dispatchEvent(new Event("creditsUpdated"))
    }

    const apiEndpoint = "/api/generate-image"
    console.log("[v0] CREATE PAGE - API endpoint:", apiEndpoint)

    const requestBody = nsfwMode
      ? {
          prompt,
          negativePrompt: negativePrompt || "low quality, blurry, distorted",
          style,
          poses,
          filter,
          emotion,
          quality,
          imageSize,
          detail: detail[0],
          creativity: creativity[0],
          restoreFaces,
          ageSlider: Math.max(18, ageSlider[0]),
          weightSlider: (weightSlider[0] - 50) / 50, // Convert 0-100 to -1 to 1
          breastSlider: (breastSlider[0] - 50) / 50,
          assSlider: (assSlider[0] - 50) / 50,
          seed: Math.floor(Math.random() * 1000000),
          nsfwMode: true,
        }
      : {
          prompt,
          nsfwMode: false,
        }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (walletAddress) {
      headers["x-wallet-address"] = walletAddress
      console.log("[v0] CREATE PAGE - Sending wallet address in headers:", walletAddress)
    } else {
      console.log("[v0] CREATE PAGE - No wallet address, localStorage credits already deducted")
    }

    console.log("[v0] CREATE PAGE - Making API request to:", apiEndpoint)

    try {
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      })

      console.log("[v0] CREATE PAGE - API response status:", response.status)
      const data = await response.json()

      if (!response.ok) {
        if (!walletAddress) {
          const cost = CreditManager.getCreditCost(quality, false)
          const currentLocalCredits = CreditManager.getLocalCredits().credits
          CreditManager.updateLocalCredits(currentLocalCredits + cost)
          console.log("[v0] CREATE PAGE - LocalStorage credits refunded after API error")
          setCredits(CreditManager.getLocalCredits().credits)
          window.dispatchEvent(new Event("creditsUpdated"))
        }

        if (data.error === "INSUFFICIENT_CREDITS") {
          throw new Error(`${data.message}\n\nClick "Get Credits" to continue generating.`)
        }

        if (data.message?.includes("flagged by AI moderation") || data.message?.includes("explicit material")) {
          console.log("[v0] NSFW content detected - proceeding with generation and NSFW tagging")
        } else if (data.message?.includes("gems")) {
          throw new Error(`${data.message}\n\nVisit promptchan.com/gems to purchase more gems.`)
        } else {
          throw new Error(data.message || "Failed to generate image")
        }
      }

      if (!data.imageUrl) {
        if (!walletAddress) {
          const cost = CreditManager.getCreditCost(quality, false)
          const currentLocalCredits = CreditManager.getLocalCredits().credits
          CreditManager.updateLocalCredits(currentLocalCredits + cost)
          console.log("[v0] CREATE PAGE - LocalStorage credits refunded - no image URL")
          setCredits(CreditManager.getLocalCredits().credits)
          window.dispatchEvent(new Event("creditsUpdated"))
        }
        throw new Error("No image URL received from API")
      }

      if (walletAddress) {
        console.log("[v0] CREATE PAGE - Fetching updated credits after generation")
        const newCredits = await CreditManager.getCredits(walletAddress)
        console.log("[v0] CREATE PAGE - Updated credits:", newCredits)
        setCredits(newCredits)
        window.dispatchEvent(new Event("creditsUpdated"))
      }

      let permanentImageUrl = data.imageUrl
      try {
        console.log("[v0] Saving image to gallery to get permanent URL")
        const galleryResponse = await fetch("/api/gallery/save", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageUrl: data.imageUrl,
            prompt,
            contentType: "image",
            nsfwMode: nsfwMode, // Pass nsfwMode flag to gallery save API
            settings: {
              style,
              poses,
              filter,
              emotion,
              quality,
              imageSize,
              ageSlider: ageSlider[0],
              weightSlider: weightSlider[0],
              breastSlider: breastSlider[0],
              assSlider: assSlider[0],
            },
          }),
        })

        if (galleryResponse.ok) {
          const galleryResult = await galleryResponse.json()
          if (galleryResult.item?.url) {
            permanentImageUrl = galleryResult.item.url
            console.log("[v0] Image saved to gallery with permanent URL:", permanentImageUrl)
          }
        }
      } catch (galleryError) {
        console.warn("[v0] Gallery save error, using temporary URL:", galleryError)
      }

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: permanentImageUrl,
        prompt,
        timestamp: new Date(),
      }

      setGeneratedImages((prev) => [newImage, ...prev])

      if (isMobile) {
        setLatestGeneratedItem(newImage)
        setShowMobilePopup(true)
      }

      const cachedImage: CachedImage = {
        id: newImage.id,
        url: permanentImageUrl,
        prompt: newImage.prompt,
        timestamp: newImage.timestamp,
        settings: nsfwMode
          ? {
              style,
              poses,
              filter,
              emotion,
              quality,
              imageSize,
              detail: detail[0],
              creativity: creativity[0],
              restoreFaces,
              ageSlider: ageSlider[0],
              weightSlider: weightSlider[0],
              breastSlider: breastSlider[0],
              assSlider: assSlider[0],
            }
          : {},
      }
      ImageCacheManager.saveImage(cachedImage)
      console.log("[v0] Image cached with permanent URL")
    } catch (error) {
      if (!walletAddress) {
        const cost = CreditManager.getCreditCost(quality, false)
        const currentLocalCredits = CreditManager.getLocalCredits().credits
        CreditManager.updateLocalCredits(currentLocalCredits + cost)
        console.log("[v0] CREATE PAGE - LocalStorage credits refunded after error")
        setCredits(CreditManager.getLocalCredits().credits)
        window.dispatchEvent(new Event("creditsUpdated"))
      }
      throw error
    }
  }

  const handleVideoGeneration = async (walletAddress?: string) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (walletAddress) {
      headers["x-wallet-address"] = walletAddress
    }

    const response = await fetch("/api/generate-video", {
      method: "POST",
      headers,
      body: JSON.stringify({
        prompt,
        age_slider: ageSlider[0],
        audioEnabled,
        video_quality: videoQuality,
        aspect: videoAspect,
        seed: Math.floor(Math.random() * 1000000),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      if (data.error === "INSUFFICIENT_CREDITS") {
        throw new Error(`${data.message}\n\nClick "Get Credits" to continue generating.`)
      }

      throw new Error(data.message || "Failed to generate video")
    }

    if (!data.videoUrl) {
      throw new Error("No video URL received from API")
    }

    const newCredits = await CreditManager.getCredits(walletAddress)
    setCredits(newCredits)
    window.dispatchEvent(new Event("creditsUpdated"))

    const newVideo: GeneratedVideo = {
      id: Date.now().toString(),
      url: data.videoUrl,
      prompt,
      timestamp: new Date(),
    }

    setGeneratedVideos((prev) => [newVideo, ...prev])

    if (isMobile) {
      setLatestGeneratedItem(newVideo)
      setShowMobilePopup(true)
    }

    try {
      console.log("[v0] Saving video to gallery:", { url: data.videoUrl, prompt, contentType: "video" })

      const galleryResponse = await fetch("/api/gallery/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: data.videoUrl,
          prompt,
          contentType: "video",
          settings: {
            videoQuality,
            videoAspect,
            audioEnabled,
            ageSlider: ageSlider[0],
          },
        }),
      })

      if (galleryResponse.ok) {
        const galleryResult = await galleryResponse.json()
        console.log("[v0] Video successfully saved to gallery:", galleryResult)
      } else {
        const errorData = await galleryResponse.json()
        console.error("[v0] Gallery save failed:", errorData)
      }
    } catch (galleryError) {
      console.error("[v0] Gallery auto-save error:", galleryError)
    }
  }

  const downloadContent = async (url: string, prompt: string, contentType: "image" | "video" = "image") => {
    try {
      const extension = contentType === "video" ? "mp4" : "png"
      const filename = `Alpha-AI-${prompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, "-")}.${extension}`

      const response = await fetch("/api/download-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: url,
          filename: filename,
          contentType: contentType,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to download ${contentType}`)
      }

      // Create blob from response and trigger download
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error(`Error downloading ${contentType}:`, error)
      alert(`Failed to download ${contentType}. Please try again.`)
    }
  }

  const downloadImage = (url: string, prompt: string) => downloadContent(url, prompt, "image")

  const canAffordGeneration = async () => {
    const walletAddress = connected && publicKey ? publicKey.toString() : undefined
    return await CreditManager.canAfford(quality as keyof typeof CREDIT_COSTS, walletAddress)
  }

  const getCreditCost = () => {
    return CreditManager.getCreditCost(quality)
  }

  const openModal = (item: GeneratedImage | GeneratedVideo, type: "image" | "video") => {
    if (type === "image") {
      setSelectedImage(item as GeneratedImage)
      setSelectedVideo(null)
    } else {
      setSelectedVideo(item as GeneratedVideo)
      setSelectedImage(null)
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedImage(null)
    setSelectedVideo(null)
  }

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt first")
      return
    }

    setIsEnhancing(true)

    try {
      const response = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          nsfwMode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to enhance prompt")
      }

      if (data.enhancedPrompt) {
        setPrompt(data.enhancedPrompt)
      }
    } catch (error) {
      console.error("Error enhancing prompt:", error)
      alert(`Error: ${error instanceof Error ? error.message : "Failed to enhance prompt"}`)
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleImageError = (imageId: string) => {
    console.log("[v0] Image failed to load, hiding:", imageId)
    setBrokenImages((prev) => new Set(prev).add(imageId))

    ImageCacheManager.removeImage(imageId)

    setGeneratedImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>, imageId: string) => {
    const img = e.currentTarget
    // Check if image has valid dimensions
    if (img.naturalWidth === 0 || img.naturalHeight === 0) {
      console.log("[v0] Image loaded but has invalid dimensions, hiding:", imageId)
      handleImageError(imageId)
    }
  }

  const visibleImages = generatedImages.filter((img) => !brokenImages.has(img.id))
  const currentItems = generationMode === "photo" ? visibleImages : generatedVideos

  return (
    <div className="h-screen bg-background text-foreground flex flex-col lg:flex-row overflow-hidden">
      {/* Settings Panel - Left Side */}
      <div className="w-full lg:w-96 border-b lg:border-b-0 lg:border-r border-border bg-background/50 backdrop-blur-sm flex flex-col h-screen lg:h-full">
        {/* Header */}
        <div className="flex justify-between items-center p-3 sm:p-4 border-b border-border/30 flex-shrink-0 h-auto lg:h-[73px]">
          <div className="flex items-center gap-2 sm:gap-3">
            <h2 className="text-base sm:text-lg font-mono uppercase tracking-wide flex items-center gap-2 text-yellow-500">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              AI GENERATOR
            </h2>
            <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4">
              <button
                onClick={() => setGenerationMode("photo")}
                className={`p-1 rounded transition-colors ${
                  generationMode === "photo" ? "text-primary bg-primary/20" : "text-foreground/60 hover:text-foreground"
                }`}
              >
                <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              <span className="text-foreground/40 text-sm">/</span>
              <button
                onClick={() => setGenerationMode("video")}
                className={`p-1 rounded transition-colors ${
                  generationMode === "video" ? "text-primary bg-primary/20" : "text-foreground/60 hover:text-foreground"
                }`}
              >
                <Video className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* Prompt Input */}
              <div>
                <label className="text-xs sm:text-sm font-mono uppercase mb-2 block tracking-wide">Prompt</label>
                <Textarea
                  placeholder={
                    generationMode === "photo"
                      ? "DESCRIBE THE IMAGE YOU WANT TO GENERATE..."
                      : "DESCRIBE THE VIDEO YOU WANT TO GENERATE..."
                  }
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[60px] sm:min-h-[80px] resize-none bg-background/50 border-border/50 font-mono text-xs sm:text-sm backdrop-blur-sm focus:border-primary/50"
                />
                {/* Enhance with AI button below prompt */}
                <Button
                  onClick={handleEnhancePrompt}
                  disabled={!prompt.trim() || isEnhancing}
                  variant="outline"
                  size="sm"
                  className="w-full mt-2 font-mono uppercase text-xs h-8 border-primary/30 text-primary hover:bg-primary/10 bg-transparent"
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      ENHANCING...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-2" />
                      ENHANCE WITH AI
                    </>
                  )}
                </Button>
              </div>

              {generationMode === "photo" && (
                <>
                  <div className="flex items-center justify-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nsfwMode}
                        onChange={(e) => setNsfwMode(e.target.checked)}
                        className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 bg-background border-border rounded focus:ring-yellow-500 focus:ring-2"
                      />
                      <span className="font-mono uppercase text-xs sm:text-sm tracking-wide text-yellow-500">
                        NSFW MODE
                      </span>
                    </label>
                  </div>

                  {nsfwMode && (
                    <div className="space-y-3 sm:space-y-4 border-t border-border/30 pt-3 sm:pt-4">
                      <h3 className="text-xs font-mono uppercase text-primary tracking-wide">Advanced Settings</h3>

                      {/* Style */}
                      <div>
                        <label className="text-xs font-mono uppercase mb-2 block tracking-wide">Style</label>
                        <Select value={style} onValueChange={setStyle}>
                          <SelectTrigger className="bg-background/50 border-border/50 hover:bg-accent/50 h-8 sm:h-9 text-xs font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border max-h-[200px]">
                            <SelectItem value="Cinematic">Cinematic</SelectItem>
                            <SelectItem value="Anime">Anime</SelectItem>
                            <SelectItem value="Hyperreal">Hyperreal</SelectItem>
                            <SelectItem value="Hyperanime">Hyperanime</SelectItem>
                            <SelectItem value="K-Pop">K-Pop</SelectItem>
                            <SelectItem value="Fur">Fur</SelectItem>
                            <SelectItem value="Furtune">Furtune</SelectItem>
                            <SelectItem value="Render XL+">Render XL+</SelectItem>
                            <SelectItem value="Illustration XL+">Illustration XL+</SelectItem>
                            <SelectItem value="Anime XL">Anime XL</SelectItem>
                            <SelectItem value="Anime XL+">Anime XL+</SelectItem>
                            <SelectItem value="Hardcore XL">Hardcore XL</SelectItem>
                            <SelectItem value="Cinematic XL">Cinematic XL</SelectItem>
                            <SelectItem value="Photo XL+">Photo XL+</SelectItem>
                            <SelectItem value="Hyperreal XL+">Hyperreal XL+</SelectItem>
                            <SelectItem value="Hyperreal XL+ v2">Hyperreal XL+ v2</SelectItem>
                            <SelectItem value="Photo XL+ v2">Photo XL+ v2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filter */}
                      <div>
                        <label className="text-xs font-mono uppercase mb-2 block tracking-wide">Filter</label>
                        <Select value={filter} onValueChange={setFilter}>
                          <SelectTrigger className="bg-background/50 border-border/50 hover:bg-accent/50 h-8 sm:h-9 text-xs font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border max-h-[200px]">
                            <SelectItem value="Default">Default</SelectItem>
                            <SelectItem value="Cinematic">Cinematic</SelectItem>
                            <SelectItem value="Studio">Studio</SelectItem>
                            <SelectItem value="Flash">Flash</SelectItem>
                            <SelectItem value="Analog">Analog</SelectItem>
                            <SelectItem value="Professional">Professional</SelectItem>
                            <SelectItem value="Polaroid">Polaroid</SelectItem>
                            <SelectItem value="Vintage">Vintage</SelectItem>
                            <SelectItem value="Manga">Manga</SelectItem>
                            <SelectItem value="Cyberpunk">Cyberpunk</SelectItem>
                            <SelectItem value="VHS">VHS</SelectItem>
                            <SelectItem value="Pixel XL">Pixel XL</SelectItem>
                            <SelectItem value="Comic XL">Comic XL</SelectItem>
                            <SelectItem value="Retro Porn XL">Retro Porn XL</SelectItem>
                            <SelectItem value="Fire Style XL">Fire Style XL</SelectItem>
                            <SelectItem value="Hyper">Hyper</SelectItem>
                            <SelectItem value="3D">3D</SelectItem>
                            <SelectItem value="Sketch">Sketch</SelectItem>
                            <SelectItem value="Watercolor">Watercolor</SelectItem>
                            <SelectItem value="Lineart">Lineart</SelectItem>
                            <SelectItem value="Moody">Moody</SelectItem>
                            <SelectItem value="Oil Painting">Oil Painting</SelectItem>
                            <SelectItem value="Rainbow">Rainbow</SelectItem>
                            <SelectItem value="Artsy">Artsy</SelectItem>
                            <SelectItem value="Artsy 2">Artsy 2</SelectItem>
                            <SelectItem value="Cartoon">Cartoon</SelectItem>
                            <SelectItem value="Cartoon Vintage">Cartoon Vintage</SelectItem>
                            <SelectItem value="Painted">Painted</SelectItem>
                            <SelectItem value="Cartoon 2">Cartoon 2</SelectItem>
                            <SelectItem value="Cartoon 3">Cartoon 3</SelectItem>
                            <SelectItem value="Cartoon Minimalist">Cartoon Minimalist</SelectItem>
                            <SelectItem value="Character Sheet">Character Sheet</SelectItem>
                            <SelectItem value="Vintage Comic">Vintage Comic</SelectItem>
                            <SelectItem value="Pixel Art">Pixel Art</SelectItem>
                            <SelectItem value="Anime Studio">Anime Studio</SelectItem>
                            <SelectItem value="Polariod Picture">Polariod Picture</SelectItem>
                            <SelectItem value="Flash Photo">Flash Photo</SelectItem>
                            <SelectItem value="Noir Movie">Noir Movie</SelectItem>
                            <SelectItem value="Analog Photo">Analog Photo</SelectItem>
                            <SelectItem value="Vintage Photo">Vintage Photo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Emotion */}
                      <div>
                        <label className="text-xs font-mono uppercase mb-2 block tracking-wide">Emotion</label>
                        <Select value={emotion} onValueChange={setEmotion}>
                          <SelectTrigger className="bg-background/50 border-border/50 hover:bg-accent/50 h-8 sm:h-9 text-xs font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border">
                            <SelectItem value="Default">Default</SelectItem>
                            <SelectItem value="Upset">Upset</SelectItem>
                            <SelectItem value="Disgusted">Disgusted</SelectItem>
                            <SelectItem value="Scared">Scared</SelectItem>
                            <SelectItem value="Winking">Winking</SelectItem>
                            <SelectItem value="Angry">Angry</SelectItem>
                            <SelectItem value="Smiling">Smiling</SelectItem>
                            <SelectItem value="Laughing">Laughing</SelectItem>
                            <SelectItem value="Ouch">Ouch</SelectItem>
                            <SelectItem value="Shocked">Shocked</SelectItem>
                            <SelectItem value="Orgasm Face">Orgasm Face</SelectItem>
                            <SelectItem value="Stick out Tongue">Stick out Tongue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Quality */}
                      <div>
                        <label className="text-xs font-mono uppercase mb-2 block tracking-wide">Quality</label>
                        <Select value={quality} onValueChange={setQuality}>
                          <SelectTrigger className="bg-background/50 border-border/50 hover:bg-accent/50 h-8 sm:h-9 text-xs font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border">
                            <SelectItem value="Ultra">Ultra (1 credit)</SelectItem>
                            <SelectItem value="Extreme">Extreme (2 credits)</SelectItem>
                            <SelectItem value="Max">Max (3 credits)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Image Size */}
                      <div>
                        <label className="text-xs font-mono uppercase mb-2 block tracking-wide">Image Size</label>
                        <Select value={imageSize} onValueChange={setImageSize}>
                          <SelectTrigger className="bg-background/50 border-border/50 hover:bg-accent/50 h-8 sm:h-9 text-xs font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-background border-border">
                            <SelectItem value="512x512">512x512 (Square)</SelectItem>
                            <SelectItem value="512x768">512x768 (Portrait)</SelectItem>
                            <SelectItem value="768x512">768x512 (Landscape)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Detail Slider */}
                      <div>
                        <label className="text-xs font-mono uppercase mb-2 block tracking-wide">
                          Detail Level: {detail[0]}
                        </label>
                        <Slider
                          value={detail}
                          onValueChange={setDetail}
                          max={2}
                          min={-2}
                          step={0.5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-foreground/60 mt-1 font-mono">
                          <span>-2</span>
                          <span>2</span>
                        </div>
                      </div>

                      {/* Creativity Slider */}
                      <div>
                        <label className="text-xs font-mono uppercase mb-2 block tracking-wide">
                          Creativity: {creativity[0]}
                        </label>
                        <Slider
                          value={creativity}
                          onValueChange={setCreativity}
                          max={100}
                          min={0}
                          step={10}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-foreground/60 mt-1 font-mono">
                          <span>0</span>
                          <span>30</span>
                          <span>50</span>
                          <span>70</span>
                          <span>100</span>
                        </div>
                      </div>

                      {/* Age Slider */}
                      <div>
                        <label className="text-xs font-mono uppercase mb-2 block tracking-wide">
                          Age: {ageSlider[0]}
                        </label>
                        <Slider
                          value={ageSlider}
                          onValueChange={setAgeSlider}
                          max={60}
                          min={18}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-foreground/60 mt-1 font-mono">
                          <span>18</span>
                          <span>60</span>
                        </div>
                      </div>

                      {/* Weight Slider */}
                      <div>
                        <label className="text-xs font-mono uppercase mb-2 block tracking-wide">
                          Body Weight: {weightSlider[0]}
                        </label>
                        <Slider
                          value={weightSlider}
                          onValueChange={setWeightSlider}
                          max={100}
                          min={0}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-foreground/60 mt-1 font-mono">
                          <span>Thin</span>
                          <span>Normal</span>
                          <span>Heavy</span>
                        </div>
                      </div>

                      {/* Breast Slider */}
                      <div>
                        <label className="text-xs font-mono uppercase mb-2 block tracking-wide">
                          Breast Size: {breastSlider[0]}
                        </label>
                        <Slider
                          value={breastSlider}
                          onValueChange={setBreastSlider}
                          max={100}
                          min={0}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-foreground/60 mt-1 font-mono">
                          <span>Small</span>
                          <span>Medium</span>
                          <span>Large</span>
                        </div>
                      </div>

                      {/* Ass Slider */}
                      <div>
                        <label className="text-xs font-mono uppercase mb-2 block tracking-wide">
                          Ass Size: {assSlider[0]}
                        </label>
                        <Slider
                          value={assSlider}
                          onValueChange={setAssSlider}
                          max={100}
                          min={0}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-foreground/60 mt-1 font-mono">
                          <span>Small</span>
                          <span>Medium</span>
                          <span>Large</span>
                        </div>
                      </div>

                      {/* Restore Faces */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="restoreFaces"
                          checked={restoreFaces}
                          onChange={(e) => setRestoreFaces(e.target.checked)}
                          className="w-3 h-3 sm:w-4 sm:h-4"
                        />
                        <label htmlFor="restoreFaces" className="text-xs font-mono uppercase tracking-wide">
                          Restore Faces (+1 credit)
                        </label>
                      </div>

                      {/* Negative Prompt */}
                      <div>
                        <label className="text-xs font-mono uppercase mb-2 block tracking-wide">
                          Negative Prompt (Optional)
                        </label>
                        <Textarea
                          placeholder="WHAT TO AVOID IN THE IMAGE..."
                          value={negativePrompt}
                          onChange={(e) => setNegativePrompt(e.target.value)}
                          className="min-h-[60px] resize-none bg-background/50 border-border/50 font-mono text-xs backdrop-blur-sm focus:border-primary/50"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {generationMode === "video" && (
                <>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="text-xs font-mono uppercase mb-2 block tracking-wide">Video Quality</label>
                      <Select value={videoQuality} onValueChange={setVideoQuality}>
                        <SelectTrigger className="bg-background/50 border-border/50 hover:bg-accent/50 h-8 sm:h-9 text-xs font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                          <SelectItem value="Standard">Standard (5 credits)</SelectItem>
                          <SelectItem value="High">High (6 credits)</SelectItem>
                          <SelectItem value="Max">Max (7 credits)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-mono uppercase mb-2 block tracking-wide">Aspect Ratio</label>
                      <Select value={videoAspect} onValueChange={setVideoAspect}>
                        <SelectTrigger className="bg-background/50 border-border/50 hover:bg-accent/50 h-8 sm:h-9 text-xs font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                          <SelectItem value="Portrait">Portrait</SelectItem>
                          <SelectItem value="Wide">Wide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="audioEnabled"
                      checked={audioEnabled}
                      onChange={(e) => setAudioEnabled(e.target.checked)}
                      className="w-3 h-3 sm:w-4 sm:h-4"
                    />
                    <label htmlFor="audioEnabled" className="text-xs font-mono uppercase tracking-wide">
                      Enable Audio
                    </label>
                  </div>

                  <div>
                    <label className="text-xs font-mono uppercase mb-2 block tracking-wide">Age: {ageSlider[0]}</label>
                    <Slider
                      value={ageSlider}
                      onValueChange={setAgeSlider}
                      max={60}
                      min={18}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-foreground/60 mt-1 font-mono">
                      <span>18</span>
                      <span>60</span>
                    </div>
                  </div>
                </>
              )}

              {credits < CreditManager.getCreditCost(quality, generationMode === "video") && (
                <div className="flex items-center gap-2 p-2 sm:p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400">
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="text-xs font-mono">
                    Insufficient credits for {quality} quality. Click "Get Credits" to keep generating.
                  </span>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Generate Button - Fixed at bottom */}
        <div className="p-3 sm:p-4 bg-background/95 backdrop-blur-sm border-t border-border/30 flex-shrink-0">
          <Button
            onClick={handleGenerate}
            disabled={
              !prompt.trim() ||
              isGenerating ||
              credits < CreditManager.getCreditCost(quality, generationMode === "video")
            }
            className="w-full font-mono uppercase text-xs sm:text-sm h-10 sm:h-12"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                GENERATING...
              </>
            ) : (
              `GENERATE ${generationMode.toUpperCase()}`
            )}
          </Button>
        </div>
      </div>

      {/* Generated Images Section - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:flex flex-1 flex-col h-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 border-b border-border/30 flex-shrink-0 h-auto lg:h-[73px] gap-2 sm:gap-0">
          <h3 className="text-base sm:text-lg font-mono uppercase tracking-wide">
            GENERATED {generationMode === "photo" ? "IMAGES" : "VIDEOS"}
          </h3>
          <div className="flex gap-2 items-center flex-wrap">
            <CreditDisplay />
            <WalletConnectButton />
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="font-mono uppercase text-xs border-none outline-none focus:outline-none"
              >
                <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">BACK TO HOME</span>
                <span className="sm:hidden">HOME</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-6">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 bg-primary/20 flex items-center justify-center"
                style={{
                  clipPath:
                    "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
                }}
              >
                {generationMode === "photo" ? (
                  <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                ) : (
                  <Video className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-mono uppercase mb-3 sm:mb-4">
                AI {generationMode.toUpperCase()} GENERATOR 🔥
              </h3>
              <p className="text-foreground/60 font-mono text-xs sm:text-sm max-w-md px-4">
                CREATE STUNNING CONTENT WITH OUR ADVANCED {generationMode.toUpperCase()} GENERATOR
              </p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6 p-3 sm:p-6">
                {currentItems.map((item) => (
                  <div key={item.id} className="group relative">
                    <div
                      className="aspect-square overflow-hidden bg-foreground/5 border border-border/50 cursor-pointer"
                      style={{
                        clipPath:
                          "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
                      }}
                      onClick={() => openModal(item, generationMode === "photo" ? "image" : "video")}
                    >
                      {generationMode === "photo" ? (
                        <img
                          src={item.url || "/placeholder.svg"}
                          alt={item.prompt}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          onError={() => handleImageError(item.id)}
                          onLoad={(e) => handleImageLoad(e, item.id)}
                        />
                      ) : (
                        <video
                          src={item.url}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          muted
                          loop
                          playsInline
                          onError={() => {
                            console.log("[v0] Video failed to load, hiding:", item.id)
                            setGeneratedVideos((prev) => prev.filter((v) => v.id !== item.id))
                          }}
                        />
                      )}
                    </div>

                    {/* Item Actions */}
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadContent(item.url, item.prompt, generationMode === "photo" ? "image" : "video")
                        }}
                        className="w-6 h-6 sm:w-8 sm:h-8 p-0"
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>

                    {/* Item Info */}
                    <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs font-mono">
                          {item.timestamp.toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Mobile Popup for Newly Generated Content */}
      <Dialog open={showMobilePopup} onOpenChange={setShowMobilePopup}>
        <DialogContent className="max-w-[90vw] max-h-[80vh] p-4">
          <DialogHeader>
            <DialogTitle className="font-mono uppercase text-center text-yellow-500">
              {generationMode === "photo" ? "IMAGE" : "VIDEO"} GENERATED! 🔥
            </DialogTitle>
          </DialogHeader>

          {latestGeneratedItem && (
            <div className="flex flex-col items-center space-y-4">
              <div
                className="w-full max-w-sm aspect-square overflow-hidden bg-foreground/5 border border-border/50"
                style={{
                  clipPath:
                    "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
                }}
              >
                {generationMode === "photo" ? (
                  <img
                    src={latestGeneratedItem.url || "/placeholder.svg"}
                    alt={latestGeneratedItem.prompt}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video src={latestGeneratedItem.url} controls className="w-full h-full object-cover" playsInline />
                )}
              </div>

              <div className="flex gap-2 w-full">
                <Button
                  onClick={() =>
                    downloadContent(
                      latestGeneratedItem.url,
                      latestGeneratedItem.prompt,
                      generationMode === "photo" ? "image" : "video",
                    )
                  }
                  className="flex-1 font-mono uppercase text-xs"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  DOWNLOAD
                </Button>
                <Button onClick={() => setShowMobilePopup(false)} className="flex-1 font-mono uppercase text-xs">
                  CONTINUE
                </Button>
              </div>

              <p className="text-xs text-foreground/60 font-mono text-center px-2">{latestGeneratedItem.prompt}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

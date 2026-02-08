"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Home, Download, ThumbsUp, Camera, Video } from "lucide-react"
import Link from "next/link"
import { TopPhotosMarquee } from "@/components/top-photos-marquee"

interface GalleryItem {
  id: string
  url: string
  filename: string
  createdAt: string
  size: number
  prompt?: string
  upvotes?: number
  downvotes?: number
  voteRatio?: number
  contentType?: "image" | "video"
  nsfw?: boolean
}

type GalleryMode = "images" | "videos"

export default function GalleryPage() {
  const searchParams = useSearchParams()

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [userVotes, setUserVotes] = useState<Record<string, string>>({})
  const [galleryMode, setGalleryMode] = useState<GalleryMode>(() => {
    const type = searchParams.get("type")
    return type === "videos" ? "videos" : "images"
  })
  const [enableNSFW, setEnableNSFW] = useState(false)
  const [userIdentifier] = useState(() => {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  })

  useEffect(() => {
    const type = searchParams.get("type")
    if (type === "videos") {
      setGalleryMode("videos")
    } else if (type === "images") {
      setGalleryMode("images")
    }
  }, [searchParams])

  useEffect(() => {
    loadGalleryItems()
  }, [])

  const loadGalleryItems = async () => {
    try {
      const response = await fetch("/api/gallery/list")
      const data = await response.json()

      if (data.success) {
        console.log(
          "[v0] Raw database items:",
          data.items.slice(0, 3).map((item) => ({
            id: item.id,
            nsfw: item.nsfw,
            nsfwType: typeof item.nsfw,
          })),
        )

        setGalleryItems(data.items)
        await loadUserVotes(data.items)
      }
    } catch (error) {
      console.error("Failed to load gallery:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserVotes = async (items: GalleryItem[]) => {
    if (!items.length) return

    try {
      const itemIds = items.map((item) => item.id).join(",")
      const response = await fetch(
        `/api/gallery/vote-status?galleryItemIds=${itemIds}&userIdentifier=${userIdentifier}`,
      )
      const data = await response.json()

      if (data.success && data.votes) {
        setUserVotes(data.votes)
      }
    } catch (error) {
      console.error("Failed to load vote statuses:", error)
      // Continue without vote data if this fails
    }
  }

  const handleVote = async (item: GalleryItem, voteType: "upvote" | "downvote") => {
    try {
      const response = await fetch("/api/gallery/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          galleryItemId: item.id,
          voteType,
          userIdentifier,
        }),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("Failed to parse vote response:", parseError)
        return
      }

      if (data.success) {
        // Update the gallery item with new vote counts
        setGalleryItems((prev) =>
          prev.map((galleryItem) =>
            galleryItem.id === item.id
              ? {
                  ...galleryItem,
                  upvotes: data.upvotes,
                  downvotes: data.downvotes,
                  voteRatio: data.voteRatio,
                }
              : galleryItem,
          ),
        )

        setUserVotes((prev) => {
          const newVotes = { ...prev }
          if (prev[item.id] === voteType) {
            // Remove vote if clicking same button (toggle off)
            delete newVotes[item.id]
          } else {
            // Set new vote (either first vote or switching from opposite)
            newVotes[item.id] = voteType
          }
          return newVotes
        })
      }
    } catch (error) {
      console.error("Failed to vote:", error)
    }
  }

  const downloadImage = async (item: GalleryItem) => {
    try {
      const response = await fetch("/api/download-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: item.url }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = item.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Failed to download image:", error)
    }
  }

  const getTimeDisplay = (createdAt: string) => {
    const photoDate = new Date(createdAt)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - photoDate.getTime()) / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)

    if (diffInHours < 1) {
      if (diffInMinutes < 1) {
        return "< 1 min ago"
      }
      return `${diffInMinutes} min${diffInMinutes === 1 ? "" : "s"} ago`
    } else if (diffInHours < 24) {
      return `${diffInHours} hr${diffInHours === 1 ? "" : "s"} ago`
    } else {
      return new Date(createdAt).toLocaleDateString()
    }
  }

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedItem(null)
      }
    }

    if (selectedItem) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [selectedItem])

  const filteredItems = galleryItems.filter((item) => {
    // Filter by content type (images/videos)
    const matchesContentType =
      galleryMode === "images" ? !item.contentType || item.contentType === "image" : item.contentType === "video"

    console.log(
      `[v0] Item ${item.id}: nsfw=${item.nsfw}, enableNSFW=${enableNSFW}, matchesNSFW=${enableNSFW ? item.nsfw : !item.nsfw}`,
    )

    const matchesNSFW = enableNSFW ? item.nsfw : !item.nsfw

    const shouldShow = matchesContentType && matchesNSFW
    console.log(
      `[v0] Item ${item.id} final result: shouldShow=${shouldShow} (contentType=${matchesContentType}, nsfw=${matchesNSFW})`,
    )

    return shouldShow
  })

  console.log(
    `[v0] FILTERING SUMMARY - Total items: ${galleryItems.length}, Filtered items: ${filteredItems.length}, EnableNSFW: ${enableNSFW}, Gallery mode: ${galleryMode}`,
  )
  console.log(
    `[v0] Sample items NSFW status:`,
    galleryItems.slice(0, 3).map((item) => ({ id: item.id, nsfw: item.nsfw })),
  )

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b border-gray-800 h-auto sm:h-[73px] gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-black rounded-sm" />
          </div>
          <h1 className="text-lg sm:text-xl font-mono uppercase tracking-wide text-yellow-500">ALPHA GALLERY</h1>
          <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4">
            <button
              onClick={() => setGalleryMode("images")}
              className={`flex items-center gap-1 font-mono uppercase text-xs transition-colors ${
                galleryMode === "images" ? "text-yellow-500" : "text-gray-400 hover:text-white"
              }`}
            >
              <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">IMAGES</span>
            </button>
            <span className="text-gray-600 text-xs">/</span>
            <button
              onClick={() => setGalleryMode("videos")}
              className={`flex items-center gap-1 font-mono uppercase text-xs transition-colors ${
                galleryMode === "videos" ? "text-yellow-500" : "text-gray-400 hover:text-white"
              }`}
            >
              <Video className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">VIDEOS</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enableNSFW}
              onChange={(e) => setEnableNSFW(e.target.checked)}
              className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 bg-gray-900 border-gray-600 rounded focus:ring-yellow-500 focus:ring-2"
            />
            <span className="font-mono uppercase text-xs sm:text-sm tracking-wide text-yellow-500">
              <span className="hidden sm:inline">NSFW MODE</span>
              <span className="sm:hidden">NSFW</span>
            </span>
          </label>

          <Link
            href="/"
            className="flex items-center gap-1 sm:gap-2 text-white hover:text-gray-300 transition-colors font-mono uppercase text-xs sm:text-sm tracking-wide"
          >
            <Home className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">BACK TO HOME</span>
            <span className="sm:hidden">HOME</span>
          </Link>
        </div>
      </div>

      {/* Gallery Content */}
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        {galleryMode === "images" && (
          <div className="mb-6 sm:mb-8">
            <div className="mb-4"></div>
            <TopPhotosMarquee
              enableNSFW={enableNSFW}
              onImageClick={(photo) =>
                setSelectedItem({
                  id: photo.id,
                  url: photo.url,
                  filename: photo.filename,
                  createdAt: photo.createdAt,
                  size: 0, // Not available in TopPhoto interface
                  prompt: photo.prompt,
                  upvotes: photo.upvotes,
                  downvotes: photo.downvotes,
                  voteRatio: photo.voteRatio,
                  contentType: "image" as const,
                  nsfw: photo.nsfw,
                })
              }
            />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400 font-mono text-sm sm:text-base">LOADING GALLERY...</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-800 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              {galleryMode === "images" ? (
                <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
              ) : (
                <Video className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600" />
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-mono uppercase tracking-wide mb-2">
              NO {galleryMode.toUpperCase()} IN GALLERY
            </h2>
            <p className="text-gray-400 font-mono text-xs sm:text-sm mb-4 sm:mb-6">
              GENERATED {galleryMode.toUpperCase()} WILL AUTOMATICALLY APPEAR HERE
            </p>
            <Link href="/create">
              <Button className="font-mono uppercase text-xs sm:text-sm">START CREATING</Button>
            </Link>
          </div>
        ) : (
          <div>
            <div className="mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-mono uppercase tracking-wide text-white mb-2">
                ALL GALLERY {galleryMode.toUpperCase()}
              </h2>
              <p className="text-gray-400 font-mono text-xs sm:text-sm">
                ({filteredItems.length} {galleryMode.toUpperCase()})
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
              {filteredItems.map((item) => {
                const upvotes = item.upvotes || 0
                const downvotes = item.downvotes || 0
                const userVote = userVotes[item.id]

                const formatUpvotes = (count: number) => {
                  if (count === 0) return "0 Upvotes"
                  if (count === 1) return "1 Upvote"
                  return `${count} Upvotes`
                }

                return (
                  <div key={item.id} className="group relative">
                    <div
                      className="aspect-square bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-yellow-500 transition-all"
                      onClick={() => setSelectedItem(item)}
                    >
                      {item.contentType === "video" ? (
                        <video
                          src={item.url || "/placeholder.svg"}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={item.url || "/placeholder.svg"}
                          alt="Gallery item"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>

                    <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-black/80 text-yellow-500 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md font-mono text-xs font-bold">
                      {formatUpvotes(upvotes)}
                    </div>

                    {/* Download button */}
                    <div className="absolute top-1 sm:top-2 right-1 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="w-6 h-6 sm:w-8 sm:h-8 bg-black/80 hover:bg-black rounded-lg flex items-center justify-center transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadImage(item)
                        }}
                      >
                        <Download className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      </button>
                    </div>

                    <div className="absolute bottom-1 sm:bottom-2 right-1 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 sm:gap-2">
                      <button
                        className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 ${
                          userVote === "upvote"
                            ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30"
                            : "bg-black/80 hover:bg-green-500/20 hover:border-green-500 border border-transparent"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVote(item, "upvote")
                        }}
                      >
                        <ThumbsUp
                          className={`w-3 h-3 sm:w-5 sm:h-5 ${userVote === "upvote" ? "text-white" : "text-green-400"}`}
                        />
                      </button>
                    </div>

                    <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 text-xs text-white/80 bg-black/60 px-1 sm:px-2 py-0.5 sm:py-1 rounded font-mono">
                      {getTimeDisplay(item.createdAt)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Full-size preview modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div className="relative max-w-4xl max-h-full flex flex-col">
            <div className="flex-shrink-0">
              {selectedItem.contentType === "video" ? (
                <video
                  src={selectedItem.url || "/placeholder.svg"}
                  controls
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <img
                  src={selectedItem.url || "/placeholder.svg"}
                  alt="Full size preview"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>

            {selectedItem.prompt && (
              <div
                className="mt-3 sm:mt-4 max-w-full bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-yellow-500 font-mono uppercase text-xs sm:text-sm tracking-wide mb-2">
                  Generation Prompt
                </h3>
                <p className="text-white font-mono text-xs sm:text-sm leading-relaxed break-words">
                  {selectedItem.prompt}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

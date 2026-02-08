"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ThumbsUp } from "lucide-react"

interface TopPhoto {
  id: string
  url: string
  filename: string
  prompt: string
  upvotes: number
  downvotes: number
  voteRatio: number
  createdAt: string
  nsfw?: boolean
}

interface TopPhotosMarqueeProps {
  enableNSFW?: boolean
  onImageClick?: (photo: TopPhoto) => void
}

export function TopPhotosMarquee({ enableNSFW = false, onImageClick }: TopPhotosMarqueeProps) {
  const [topPhotos, setTopPhotos] = useState<TopPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [userVotes, setUserVotes] = useState<Record<string, string>>({})
  const [userIdentifier] = useState(() => {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  })

  useEffect(() => {
    loadTopPhotos()
  }, [])

  const loadTopPhotos = async () => {
    try {
      const response = await fetch("/api/gallery/top-photos")
      const data = await response.json()

      if (data.success) {
        console.log(`[v0] Top photos loaded: ${data.items.length} photos`)
        setTopPhotos(data.items)
        await loadUserVotes(data.items)
      }
    } catch (error) {
      console.error("Failed to load top photos:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserVotes = async (items: TopPhoto[]) => {
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
    }
  }

  const handleVote = async (item: TopPhoto, voteType: "upvote" | "downvote", e: React.MouseEvent) => {
    e.stopPropagation()

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
        // Update the photo with new vote counts
        setTopPhotos((prev) =>
          prev.map((photo) =>
            photo.id === item.id
              ? {
                  ...photo,
                  upvotes: data.upvotes,
                  downvotes: data.downvotes,
                  voteRatio: data.voteRatio,
                }
              : photo,
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

  const formatVotes = (count: number) => {
    if (count === 0) return "0 Upvotes"
    if (count === 1) return "1 Upvote"
    return `${count} Upvotes`
  }

  const filteredPhotos = topPhotos.filter((photo) => {
    return enableNSFW ? photo.nsfw : !photo.nsfw
  })

  console.log(
    `[v0] Top photos filtering: Total=${topPhotos.length}, Filtered=${filteredPhotos.length}, NSFW=${enableNSFW}`,
  )

  if (loading) {
    return (
      <div className="w-full h-64 bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-gray-400 font-mono">LOADING TOP PHOTOS...</div>
      </div>
    )
  }

  if (filteredPhotos.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 font-mono mb-2">NO TOP PHOTOS YET</div>
          <div className="text-gray-500 font-mono text-sm">START VOTING TO SEE TOP PHOTOS HERE</div>
        </div>
      </div>
    )
  }

  const duplicatedPhotos = [...filteredPhotos, ...filteredPhotos, ...filteredPhotos]

  return (
    <div className="w-full h-64 overflow-hidden relative">
      <div
        className="flex h-full gap-4 will-change-transform"
        style={{
          width: `${duplicatedPhotos.length * 280}px`,
          animation: `marqueeSmooth ${filteredPhotos.length * 12}s linear infinite`,
        }}
      >
        {duplicatedPhotos.map((photo, index) => {
          const userVote = userVotes[photo.id]

          return (
            <div
              key={`${photo.id}-${index}`}
              className="aspect-square w-64 h-64 relative rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-yellow-500 transition-all group"
              style={{
                backgroundImage: `url(${photo.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
              onClick={() => onImageClick?.(photo)}
            >
              <div className="relative h-full flex flex-col justify-between p-4">
                <div className="flex items-start justify-between">
                  <div className="text-yellow-500 font-mono font-bold text-xs bg-black/60 px-2 py-1 rounded">
                    TOP #{(index % filteredPhotos.length) + 1}
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-mono font-bold text-xs bg-black/60 px-2 py-1 rounded">
                      {formatVotes(photo.upvotes)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100 ${
                      userVote === "upvote"
                        ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30"
                        : "bg-black/80 hover:bg-green-500/20 hover:border-green-500 border border-transparent"
                    }`}
                    onClick={(e) => handleVote(photo, "upvote", e)}
                  >
                    <ThumbsUp className={`w-5 h-5 ${userVote === "upvote" ? "text-white" : "text-green-400"}`} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <style jsx>{`
        @keyframes marqueeSmooth {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-${filteredPhotos.length * 280}px);
          }
        }
        .will-change-transform {
          will-change: transform;
        }
      `}</style>
    </div>
  )
}

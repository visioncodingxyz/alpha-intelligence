"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Home, Download, Trash2, Eye, EyeOff, ThumbsUp, Camera, Video, Shield, ShieldOff } from "lucide-react"
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

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [togglingNSFW, setTogglingNSFW] = useState<string | null>(null)
  const [galleryMode, setGalleryMode] = useState<GalleryMode>("images")
  const [enableNSFW, setEnableNSFW] = useState(false)
  const [userVotes, setUserVotes] = useState<Record<string, string>>({})
  const [userIdentifier] = useState(() => {
    return `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  })

  // Check if already authenticated on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem("admin-authenticated")
    if (authStatus === "true") {
      setIsAuthenticated(true)
      loadGalleryItems()
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError("")

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (data.success) {
        setIsAuthenticated(true)
        sessionStorage.setItem("admin-authenticated", "true")
        loadGalleryItems()
      } else {
        setLoginError("Invalid credentials")
      }
    } catch (error) {
      setLoginError("Authentication failed")
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem("admin-authenticated")
    setUsername("")
    setPassword("")
  }

  const loadGalleryItems = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/gallery/list")
      const data = await response.json()

      if (data.success) {
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
            delete newVotes[item.id]
          } else {
            newVotes[item.id] = voteType
          }
          return newVotes
        })
      }
    } catch (error) {
      console.error("Failed to vote:", error)
    }
  }

  const deleteImage = async (item: GalleryItem) => {
    if (!confirm(`Are you sure you want to delete this image?\n${item.filename}`)) {
      return
    }

    setDeleting(item.id)
    try {
      const response = await fetch("/api/admin/delete-image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.url }),
      })

      const data = await response.json()

      if (data.success) {
        setGalleryItems((prev) => prev.filter((i) => i.id !== item.id))
        if (selectedItem?.id === item.id) {
          setSelectedItem(null)
        }
      } else {
        alert("Failed to delete image: " + data.error)
      }
    } catch (error) {
      console.error("Failed to delete image:", error)
      alert("Failed to delete image")
    } finally {
      setDeleting(null)
    }
  }

  const toggleNSFW = async (item: GalleryItem) => {
    setTogglingNSFW(item.id)
    try {
      const response = await fetch("/api/admin/toggle-nsfw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: item.id,
          nsfw: !item.nsfw,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setGalleryItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, nsfw: !i.nsfw } : i)))

        // Update selected item if it's the same one
        if (selectedItem?.id === item.id) {
          setSelectedItem({ ...selectedItem, nsfw: !selectedItem.nsfw })
        }
      } else {
        alert("Failed to toggle NSFW status: " + data.error)
      }
    } catch (error) {
      console.error("Failed to toggle NSFW:", error)
      alert("Failed to toggle NSFW status")
    } finally {
      setTogglingNSFW(null)
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
    const matchesContentType =
      galleryMode === "images" ? !item.contentType || item.contentType === "image" : item.contentType === "video"

    const matchesNSFW = enableNSFW ? item.nsfw : !item.nsfw

    return matchesContentType && matchesNSFW
  })

  if (!isAuthenticated) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center">
        <div className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 bg-black rounded-sm" />
            </div>
            <h1 className="text-2xl font-mono uppercase tracking-wide text-red-500">ADMIN ACCESS</h1>
            <p className="text-gray-400 font-mono text-sm mt-2">RESTRICTED AREA</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="USERNAME"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white font-mono uppercase placeholder:text-gray-500"
                required
              />
            </div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white font-mono uppercase placeholder:text-gray-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {loginError && <div className="text-red-500 text-sm font-mono text-center">{loginError}</div>}
            <Button type="submit" className="w-full font-mono uppercase bg-red-600 hover:bg-red-700">
              ACCESS ADMIN
            </Button>
          </form>

          <div className="text-center mt-8">
            <Link href="/" className="text-gray-400 hover:text-white font-mono uppercase text-sm tracking-wide">
              ← BACK TO HOME
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header - Updated header to match gallery page with NSFW mode and content type toggles */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 h-[73px]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <div className="w-4 h-4 bg-black rounded-sm" />
          </div>
          <h1 className="text-xl font-mono uppercase tracking-wide text-red-500">ADMIN PANEL</h1>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setGalleryMode("images")}
              className={`flex items-center gap-1 font-mono uppercase text-xs transition-colors ${
                galleryMode === "images" ? "text-red-500" : "text-gray-400 hover:text-white"
              }`}
            >
              <Camera className="w-4 h-4" />
              IMAGES
            </button>
            <span className="text-gray-600 text-xs">/</span>
            <button
              onClick={() => setGalleryMode("videos")}
              className={`flex items-center gap-1 font-mono uppercase text-xs transition-colors ${
                galleryMode === "videos" ? "text-red-500" : "text-gray-400 hover:text-white"
              }`}
            >
              <Video className="w-4 h-4" />
              VIDEOS
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enableNSFW}
              onChange={(e) => setEnableNSFW(e.target.checked)}
              className="w-4 h-4 text-red-500 bg-gray-900 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
            />
            <span className="font-mono uppercase text-sm tracking-wide text-red-500">NSFW MODE</span>
          </label>

          <Link
            href="/"
            className="flex items-center gap-2 text-white hover:text-gray-300 transition-colors font-mono uppercase text-sm tracking-wide"
          >
            <Home className="w-4 h-4" />
            BACK TO HOME
          </Link>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="font-mono uppercase text-sm border-red-500 text-red-500 hover:bg-red-500 hover:text-black bg-transparent"
          >
            LOGOUT
          </Button>
        </div>
      </div>

      {/* Gallery Content - Updated to match gallery page layout with marquee and filtering */}
      <div className="flex-1 overflow-auto p-6">
        {galleryMode === "images" && (
          <div className="mb-8">
            <div className="mb-4"></div>
            <TopPhotosMarquee enableNSFW={enableNSFW} />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-400 font-mono">LOADING GALLERY...</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
              {galleryMode === "images" ? (
                <Camera className="w-8 h-8 text-gray-600" />
              ) : (
                <Video className="w-8 h-8 text-gray-600" />
              )}
            </div>
            <h2 className="text-xl font-mono uppercase tracking-wide mb-2">
              NO {galleryMode.toUpperCase()} IN GALLERY
            </h2>
            <p className="text-gray-400 font-mono text-sm mb-6">
              GENERATED {galleryMode.toUpperCase()} WILL AUTOMATICALLY APPEAR HERE
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-mono uppercase tracking-wide text-white mb-2">
                ALL GALLERY {galleryMode.toUpperCase()}
              </h2>
              <p className="text-gray-400 font-mono text-sm">
                ({filteredItems.length} {galleryMode.toUpperCase()})
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
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
                      className="aspect-square bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-red-500 transition-all"
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

                    <div className="absolute top-2 left-2 bg-black/80 text-red-500 px-2 py-1 rounded-md font-mono text-sm font-bold">
                      {formatUpvotes(upvotes)}
                    </div>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        className="w-8 h-8 bg-black/80 hover:bg-black rounded-lg flex items-center justify-center transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadImage(item)
                        }}
                      >
                        <Download className="w-4 h-4 text-white" />
                      </button>
                      <button
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          item.nsfw ? "bg-orange-500/80 hover:bg-orange-500" : "bg-green-500/80 hover:bg-green-500"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleNSFW(item)
                        }}
                        disabled={togglingNSFW === item.id}
                      >
                        {togglingNSFW === item.id ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        ) : item.nsfw ? (
                          <ShieldOff className="w-4 h-4 text-white" />
                        ) : (
                          <Shield className="w-4 h-4 text-white" />
                        )}
                      </button>
                      <button
                        className="w-8 h-8 bg-red-600/80 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteImage(item)
                        }}
                        disabled={deleting === item.id}
                      >
                        {deleting === item.id ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 text-white" />
                        )}
                      </button>
                    </div>

                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 ${
                          userVote === "upvote"
                            ? "bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30"
                            : "bg-black/80 hover:bg-green-500/20 hover:border-green-500 border border-transparent"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleVote(item, "upvote")
                        }}
                      >
                        <ThumbsUp className={`w-5 h-5 ${userVote === "upvote" ? "text-white" : "text-green-400"}`} />
                      </button>
                    </div>

                    <div className="absolute bottom-2 left-2 text-xs text-white/80 bg-black/60 px-2 py-1 rounded font-mono">
                      {getTimeDisplay(item.createdAt)}
                    </div>

                    {item.nsfw && (
                      <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-md font-mono text-xs font-bold">
                        NSFW
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
                className="mt-4 max-w-full bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-red-500 font-mono uppercase text-sm tracking-wide mb-2">Generation Prompt</h3>
                <p className="text-white font-mono text-sm leading-relaxed break-words">{selectedItem.prompt}</p>
              </div>
            )}

            {/* Modal admin action buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="bg-black/80 hover:bg-black"
                onClick={(e) => {
                  e.stopPropagation()
                  downloadImage(selectedItem)
                }}
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                className={`${
                  selectedItem.nsfw ? "bg-orange-500/80 hover:bg-orange-500" : "bg-green-500/80 hover:bg-green-500"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleNSFW(selectedItem)
                }}
                disabled={togglingNSFW === selectedItem.id}
              >
                {togglingNSFW === selectedItem.id ? (
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                ) : selectedItem.nsfw ? (
                  <ShieldOff className="w-4 h-4" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="bg-red-600/80 hover:bg-red-600"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteImage(selectedItem)
                }}
                disabled={deleting === selectedItem.id}
              >
                {deleting === selectedItem.id ? (
                  <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

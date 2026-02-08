// Image caching system for user-generated images
export interface CachedImage {
  id: string
  url: string
  prompt: string
  timestamp: Date
  settings: {
    style: string
    poses: string
    filter: string
    emotion: string
    quality: string
    imageSize: string
    ageSlider: number
    weightSlider: number
    breastSlider: number
    assSlider: number
  }
}

export class ImageCacheManager {
  private static STORAGE_KEY = "nsfw-ai-cached-images"
  private static MAX_CACHED_IMAGES = 50 // Limit to prevent localStorage overflow

  static getCachedImages(): CachedImage[] {
    if (typeof window === "undefined") {
      return []
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) {
        return []
      }

      const images = JSON.parse(stored)
      // Convert timestamp strings back to Date objects
      return images.map((img: any) => ({
        ...img,
        timestamp: new Date(img.timestamp),
      }))
    } catch (error) {
      console.error("[v0] Error reading cached images from localStorage:", error)
      return []
    }
  }

  static saveImage(image: CachedImage): void {
    if (typeof window === "undefined") return

    try {
      const existingImages = this.getCachedImages()

      // Add new image to the beginning of the array
      const updatedImages = [image, ...existingImages]

      // Limit the number of cached images
      const limitedImages = updatedImages.slice(0, this.MAX_CACHED_IMAGES)

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedImages))
      console.log("[v0] Image saved to cache:", image.id)
    } catch (error) {
      console.error("[v0] Error saving image to cache:", error)
    }
  }

  static removeImage(imageId: string): void {
    if (typeof window === "undefined") return

    try {
      const existingImages = this.getCachedImages()
      const filteredImages = existingImages.filter((img) => img.id !== imageId)

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredImages))
      console.log("[v0] Image removed from cache:", imageId)
    } catch (error) {
      console.error("[v0] Error removing image from cache:", error)
    }
  }

  static clearCache(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(this.STORAGE_KEY)
      console.log("[v0] Image cache cleared")
    } catch (error) {
      console.error("[v0] Error clearing image cache:", error)
    }
  }

  static getCacheSize(): number {
    if (typeof window === "undefined") return 0

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.stringify(stored).length : 0
    } catch (error) {
      console.error("[v0] Error getting cache size:", error)
      return 0
    }
  }
}

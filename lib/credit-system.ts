// Credit system for both wallet and non-wallet users
export interface CreditData {
  credits: number
  lastReset: string
}

export const CREDIT_COSTS = {
  // Image quality levels
  Ultra: 1,
  Extreme: 2,
  Max: 3,
  // Video quality levels
  Standard: 5,
  High: 6,
  // Note: Max is shared between image (3 credits) and video (7 credits)
  // We'll handle this in getCreditCost method
} as const

export const VIDEO_CREDIT_COSTS = {
  Standard: 5,
  High: 6,
  Max: 7,
} as const

export const DEFAULT_CREDITS = 5

export class CreditManager {
  private static STORAGE_KEY = "nsfw-ai-credits"

  // Get credits for non-wallet users (localStorage)
  static getLocalCredits(): CreditData {
    if (typeof window === "undefined") {
      return { credits: DEFAULT_CREDITS, lastReset: new Date().toISOString() }
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) {
        const initialData: CreditData = {
          credits: DEFAULT_CREDITS,
          lastReset: new Date().toISOString(),
        }
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initialData))
        return initialData
      }

      return JSON.parse(stored)
    } catch (error) {
      console.error("[v0] Error reading credits from localStorage:", error)
      return { credits: DEFAULT_CREDITS, lastReset: new Date().toISOString() }
    }
  }

  // Get credits for wallet users (database) - now ensures user exists
  static async getDatabaseCredits(walletAddress: string): Promise<number> {
    try {
      // Use API route instead of direct database access to avoid client-side database calls
      const response = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, action: "getOrCreate" }),
      })

      if (response.ok) {
        const { user } = await response.json()
        return user?.credit_balance || 0
      } else {
        console.error("[v0] Error fetching user credits from API:", response.statusText)
        return 0
      }
    } catch (error) {
      console.error("[v0] Error reading credits from database:", error)
      return 0
    }
  }

  // Get credits based on wallet connection status
  static async getCredits(walletAddress?: string): Promise<number> {
    if (walletAddress) {
      return await this.getDatabaseCredits(walletAddress)
    } else {
      return this.getLocalCredits().credits
    }
  }

  // Update credits for non-wallet users (localStorage)
  static updateLocalCredits(newCredits: number): void {
    if (typeof window === "undefined") return

    try {
      const creditData: CreditData = {
        credits: Math.max(0, newCredits),
        lastReset: new Date().toISOString(),
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(creditData))
    } catch (error) {
      console.error("[v0] Error saving credits to localStorage:", error)
    }
  }

  // Check if user can afford a quality level
  static async canAfford(quality: string, walletAddress?: string, isVideo = false): Promise<boolean> {
    const credits = await this.getCredits(walletAddress)
    const cost = this.getCreditCost(quality, isVideo)
    return credits >= cost
  }

  // Deduct credits based on wallet connection status
  static async deductCredits(quality: string, walletAddress?: string, isVideo = false): Promise<boolean> {
    const cost = this.getCreditCost(quality, isVideo)

    if (walletAddress) {
      // Use API route for database credits for wallet users
      try {
        const response = await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            action: "deductCredits",
            amount: cost,
          }),
        })

        if (response.ok) {
          const { success } = await response.json()
          return success
        } else {
          console.error("[v0] Error deducting database credits:", response.statusText)
          return false
        }
      } catch (error) {
        console.error("[v0] Error deducting database credits:", error)
        return false
      }
    } else {
      // localStorage credits for non-wallet users
      const { credits } = this.getLocalCredits()
      if (credits >= cost) {
        this.updateLocalCredits(credits - cost)
        return true
      }
      return false
    }
  }

  // Add credits (mainly for wallet users)
  static async addCredits(amount: number, walletAddress?: string): Promise<boolean> {
    if (walletAddress) {
      try {
        const response = await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            action: "addCredits",
            amount,
          }),
        })

        if (response.ok) {
          const { success } = await response.json()
          return success
        } else {
          console.error("[v0] Error adding database credits:", response.statusText)
          return false
        }
      } catch (error) {
        console.error("[v0] Error adding database credits:", error)
        return false
      }
    } else {
      const { credits } = this.getLocalCredits()
      this.updateLocalCredits(credits + amount)
      return true
    }
  }

  static getCreditCost(quality: string, isVideo = false): number {
    if (isVideo && quality in VIDEO_CREDIT_COSTS) {
      return VIDEO_CREDIT_COSTS[quality as keyof typeof VIDEO_CREDIT_COSTS]
    }
    return CREDIT_COSTS[quality as keyof typeof CREDIT_COSTS] || 1
  }

  // Legacy methods for backward compatibility
  static getCredits_Legacy(): CreditData {
    return this.getLocalCredits()
  }

  static updateCredits(newCredits: number): void {
    this.updateLocalCredits(newCredits)
  }

  static canAfford_Legacy(quality: keyof typeof CREDIT_COSTS): boolean {
    const { credits } = this.getLocalCredits()
    const cost = CREDIT_COSTS[quality]
    return credits >= cost
  }

  static deductCredits_Legacy(quality: keyof typeof CREDIT_COSTS): boolean {
    const { credits } = this.getLocalCredits()
    const cost = CREDIT_COSTS[quality]

    if (credits >= cost) {
      this.updateLocalCredits(credits - cost)
      return true
    }
    return false
  }
}

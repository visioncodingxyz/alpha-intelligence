export class CreditManager {
  private static readonly STORAGE_KEY = "user_credits"

  static getLocalCredits(): { credits: number; lastUpdated: Date } {
    if (typeof window === "undefined") return { credits: 0, lastUpdated: new Date() }

    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) {
      const initial = { credits: 3, lastUpdated: new Date().toISOString() }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(initial))
      return { credits: 3, lastUpdated: new Date() }
    }

    const data = JSON.parse(stored)
    return {
      credits: data.credits,
      lastUpdated: new Date(data.lastUpdated),
    }
  }

  static updateLocalCredits(credits: number): void {
    if (typeof window === "undefined") return

    const data = {
      credits,
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
  }

  static async getCredits(walletAddress?: string): Promise<number> {
    if (walletAddress) {
      try {
        const response = await fetch("/api/user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress, action: "getOrCreate" }),
        })

        if (response.ok) {
          const { user } = await response.json()
          return user.credit_balance
        }
      } catch (error) {
        console.error("Error fetching database credits:", error)
      }
      return 0
    }

    return this.getLocalCredits().credits
  }

  static getCreditCost(quality: string, isVideo = false): number {
    if (isVideo) {
      const videoCosts: Record<string, number> = {
        Standard: 5,
        High: 6,
        Max: 7,
      }
      return videoCosts[quality] || 5
    }

    const costs: Record<string, number> = {
      Ultra: 1,
      Standard: 1,
    }
    return costs[quality] || 1
  }

  static async canAfford(quality: string, walletAddress?: string, isVideo = false): Promise<boolean> {
    const cost = this.getCreditCost(quality, isVideo)
    const credits = await this.getCredits(walletAddress)
    return credits >= cost
  }
}

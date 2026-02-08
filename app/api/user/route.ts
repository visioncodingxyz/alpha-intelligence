import { type NextRequest, NextResponse } from "next/server"
import { getOrCreateUser, findUserByWallet, deductUserCredits, addUserCredits } from "@/lib/user-management"

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, action, amount } = await request.json()

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    if (action === "getOrCreate") {
      const user = await getOrCreateUser(walletAddress)
      return NextResponse.json({ user })
    }

    if (action === "get") {
      const user = await findUserByWallet(walletAddress)
      return NextResponse.json({ user })
    }

    if (action === "deductCredits") {
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: "Valid amount is required for deductCredits" }, { status: 400 })
      }

      try {
        // First ensure user exists
        const user = await getOrCreateUser(walletAddress)

        // Check if user has enough credits
        if (user.credit_balance < amount) {
          return NextResponse.json({ success: false, error: "Insufficient credits" }, { status: 400 })
        }

        // Deduct credits
        await deductUserCredits(walletAddress, amount)
        return NextResponse.json({ success: true })
      } catch (error) {
        console.error("Error deducting credits:", error)
        return NextResponse.json({ success: false, error: "Failed to deduct credits" }, { status: 500 })
      }
    }

    if (action === "addCredits") {
      if (!amount || amount <= 0) {
        return NextResponse.json({ error: "Valid amount is required for addCredits" }, { status: 400 })
      }

      try {
        // First ensure user exists
        await getOrCreateUser(walletAddress)

        // Add credits
        await addUserCredits(walletAddress, amount)
        return NextResponse.json({ success: true })
      } catch (error) {
        console.error("Error adding credits:", error)
        return NextResponse.json({ success: false, error: "Failed to add credits" }, { status: 500 })
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("User API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { recordTokenBurn } from "@/lib/token-burn-tracking"

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, transactionSignature, tokenAmount } = await request.json()

    if (!walletAddress || !transactionSignature || !tokenAmount) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const result = await recordTokenBurn(walletAddress, transactionSignature, tokenAmount)

    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Error in token burn API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

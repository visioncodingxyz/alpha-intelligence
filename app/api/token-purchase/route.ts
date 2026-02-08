import { type NextRequest, NextResponse } from "next/server"
import { recordTokenPurchase } from "@/lib/token-purchase-tracking"

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, transactionSignature, tokenAmount, solAmount } = await request.json()

    console.log("[v0] Token purchase API - Request received:", {
      walletAddress,
      transactionSignature,
      creditsRequested: tokenAmount,
      solAmountLamports: solAmount,
    })

    if (!walletAddress || !transactionSignature || !tokenAmount || !solAmount) {
      console.error("[v0] Token purchase API - Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await recordTokenPurchase(walletAddress, transactionSignature, tokenAmount, solAmount)

    if (result.success) {
      console.log("[v0] Token purchase API - Success:", { creditsAwarded: result.creditsAwarded })
      return NextResponse.json({
        success: true,
        creditsAwarded: result.creditsAwarded,
      })
    } else {
      console.error("[v0] Token purchase API - Error:", result.error)
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Token purchase API - Exception:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}

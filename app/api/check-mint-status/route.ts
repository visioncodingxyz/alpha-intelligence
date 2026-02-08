import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const actionId = searchParams.get("actionId")

    if (!actionId) {
      return NextResponse.json({ error: "actionId is required" }, { status: 400 })
    }

    console.log("[v0] Checking status for actionId:", actionId)

    const CROSSMINT_API_KEY = process.env.CROSSMINT_API_KEY

    if (!CROSSMINT_API_KEY) {
      return NextResponse.json({ error: "Crossmint API key not configured" }, { status: 500 })
    }

    const response = await fetch(`https://www.crossmint.com/api/2022-06-09/actions/${actionId}`, {
      headers: {
        "X-API-KEY": CROSSMINT_API_KEY,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Crossmint status check error:", errorText)
      return NextResponse.json({ error: "Failed to check mint status" }, { status: 500 })
    }

    const data = await response.json()

    console.log("[v0] Full Crossmint response:", JSON.stringify(data, null, 2))
    console.log("[v0] Status check result:", { status: data.status })

    let nftAddress = null

    if (data.data?.token?.mintHash) {
      nftAddress = data.data.token.mintHash
    }
    // Fallback: collection mint address (if individual NFT address not available)
    else if (data.data?.collection?.mintAddress) {
      nftAddress = data.data.collection.mintAddress
    }
    // Other fallback locations
    else if (data.nft?.onChain?.mintHash) {
      nftAddress = data.nft.onChain.mintHash
    } else if (data.nft?.onChain?.address) {
      nftAddress = data.nft.onChain.address
    } else if (data.nft?.address) {
      nftAddress = data.nft.address
    } else if (data.mintHash) {
      nftAddress = data.mintHash
    } else if (data.address) {
      nftAddress = data.address
    }

    console.log("[v0] Extracted NFT address:", nftAddress)

    return NextResponse.json({
      success: true,
      status: data.status,
      nftAddress: nftAddress,
      data: data,
    })
  } catch (error) {
    console.error("[v0] Check mint status error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

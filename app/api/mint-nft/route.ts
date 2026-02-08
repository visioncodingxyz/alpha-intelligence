import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const MINT_COST = 4 // 4 credits per NFT mint
const COLLECTION_ID = "9523194f-0a1f-43dc-a650-d65e0874df4a"

export async function POST(request: Request) {
  try {
    const { name, description, imageUrl, walletAddress, nsfwMode, collectionId } = await request.json()

    console.log("[v0] Mint NFT request:", {
      name,
      walletAddress,
      hasImage: !!imageUrl,
      nsfwMode,
      collectionId,
    })

    if (!name || !imageUrl) {
      return NextResponse.json({ error: "Name and image are required" }, { status: 400 })
    }

    if (!walletAddress) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    // Check and deduct credits
    const sql = neon(process.env.DATABASE_URL!)

    // Get current credits
    const userResult = await sql`
      SELECT credit_balance FROM users WHERE wallet_address = ${walletAddress}
    `

    if (userResult.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const currentCredits = Number(userResult[0].credit_balance)

    if (currentCredits < MINT_COST) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_CREDITS",
          message: `Insufficient credits for NFT minting. You have ${currentCredits} credits but need ${MINT_COST}.`,
        },
        { status: 402 },
      )
    }

    // Deduct credits atomically
    const updateResult = await sql`
      UPDATE users 
      SET credit_balance = credit_balance - ${MINT_COST}
      WHERE wallet_address = ${walletAddress} AND credit_balance >= ${MINT_COST}
      RETURNING credit_balance
    `

    if (updateResult.length === 0) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_CREDITS",
          message: "Insufficient credits for NFT minting.",
        },
        { status: 402 },
      )
    }

    console.log("[v0] Credits deducted successfully. New balance:", updateResult[0].credit_balance)

    // Mint NFT with Crossmint
    const CROSSMINT_API_KEY = process.env.CROSSMINT_API_KEY

    if (!CROSSMINT_API_KEY) {
      // Refund credits
      await sql`
        UPDATE users 
        SET credit_balance = credit_balance + ${MINT_COST}
        WHERE wallet_address = ${walletAddress}
      `
      return NextResponse.json({ error: "Crossmint API key not configured" }, { status: 500 })
    }

    const recipient = `solana:${walletAddress}`

    const mintPayload = {
      recipient,
      metadata: {
        name,
        image: imageUrl,
        description: description || "",
      },
      compressed: true,
      reuploadLinkedFiles: false,
    }

    console.log("[v0] Minting NFT with Crossmint:", { recipient, collectionId: COLLECTION_ID })

    const mintResponse = await fetch(`https://www.crossmint.com/api/2022-06-09/collections/${COLLECTION_ID}/nfts`, {
      method: "POST",
      headers: {
        "X-API-KEY": CROSSMINT_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mintPayload),
    })

    if (!mintResponse.ok) {
      const errorText = await mintResponse.text()
      console.error("[v0] Crossmint API error:", errorText)

      // Refund credits
      await sql`
        UPDATE users 
        SET credit_balance = credit_balance + ${MINT_COST}
        WHERE wallet_address = ${walletAddress}
      `

      return NextResponse.json({ error: "Failed to mint NFT with Crossmint", details: errorText }, { status: 500 })
    }

    const mintData = await mintResponse.json()

    console.log("[v0] Mint response received:", { actionId: mintData.actionId, id: mintData.id })

    const isNsfw = nsfwMode === true

    await sql`
      INSERT INTO nfts (
        wallet_address, 
        name, 
        description, 
        image_url, 
        collection_id, 
        crossmint_id, 
        action_id, 
        mint_status, 
        nsfw,
        created_at, 
        updated_at
      )
      VALUES (
        ${walletAddress}, 
        ${name}, 
        ${description || ""}, 
        ${imageUrl}, 
        ${COLLECTION_ID}, 
        ${mintData.id || null}, 
        ${mintData.actionId || null}, 
        'pending', 
        ${isNsfw},
        NOW(), 
        NOW()
      )
    `

    console.log("[v0] NFT saved to database")

    return NextResponse.json({
      success: true,
      actionId: mintData.actionId,
      crossmintId: mintData.id,
      message: "NFT minting started successfully",
      creditsRemaining: Number(updateResult[0].credit_balance),
    })
  } catch (error) {
    console.error("[v0] Mint NFT error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

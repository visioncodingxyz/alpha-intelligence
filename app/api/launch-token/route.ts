import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { detectNSFWTokenEnhanced } from "@/lib/enhanced-nsfw-detector"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Extract all the parameters from the request
    const {
      name,
      ticker,
      description,
      imageUrl,
      website,
      twitter,
      telegram,
      visible = 0,
      decimals = 9,
      taxTier = 6,
      initialBuy = 0,
      reward_ca = "So11111111111111111111111111111111111111112", // SOL
      mode = 0,
      dev_fee_percentage = 50,
      bondingCurveType = 1,
      ref,
      developerWallet,
      walletConnected, // Use walletConnected flag instead of private key
      nsfwMode, // Accept NSFW mode from AI generation
    } = body

    // Validate required fields
    if (!name || !ticker || !description || !developerWallet) {
      return NextResponse.json(
        { message: "Missing required fields: name, ticker, description, developerWallet" },
        { status: 400 },
      )
    }

    if (!walletConnected) {
      return NextResponse.json(
        {
          message: "Wallet not connected. Please connect your wallet and try again.",
        },
        { status: 400 },
      )
    }

    console.log("[v0] Performing comprehensive NSFW detection...")
    let nsfwDetection
    try {
      nsfwDetection = await detectNSFWTokenEnhanced(
        name,
        ticker,
        description,
        imageUrl || undefined,
        nsfwMode ? "AI generated with NSFW mode enabled" : "Token creation",
      )
      console.log("[v0] Enhanced NSFW detection result:", {
        isNSFW: nsfwDetection.isNSFW,
        confidence: nsfwDetection.confidence,
        moderationAction: nsfwDetection.moderationAction,
        hasAI: !!nsfwDetection.aiAnalysis,
        nsfwMode,
      })
    } catch (error) {
      console.error("[v0] Enhanced NSFW detection failed, using fallback:", error)
      // Fallback: automatically flag as NSFW if AI generation used NSFW mode
      nsfwDetection = {
        isNSFW: nsfwMode || false,
        confidence: nsfwMode ? 1.0 : 0.0,
        reasons: nsfwMode ? ["AI generation used NSFW mode"] : [],
        moderationAction: nsfwMode ? "flag" : "allow",
        shouldStore: true,
      }
    }

    const finalNsfwFlag = nsfwMode || nsfwDetection.isNSFW

    if (finalNsfwFlag) {
      console.log(`[v0] Token "${name}" detected as NSFW:`, {
        aiGeneratedNsfw: nsfwMode,
        contentDetectedNsfw: nsfwDetection.isNSFW,
        reasons: nsfwDetection.reasons,
      })
    }

    console.log("Creating token with RevShare SDK:", {
      name,
      ticker,
      description,
      imageUrl,
      website,
      twitter,
      telegram,
      visible,
      decimals,
      taxTier,
      initialBuy,
      reward_ca,
      mode,
      dev_fee_percentage,
      bondingCurveType,
      ref,
      developerWallet,
      isNSFW: finalNsfwFlag, // Log final NSFW status
    })

    // Calculate total cost (funding fee + initial buy) with proper rounding
    const fundingFee = 0.05 // RevShare SDK funding fee
    const totalCost = Number.parseFloat((fundingFee + Number.parseFloat(initialBuy.toString())).toFixed(3))

    console.log(
      `[v0] Total cost for token creation: ${totalCost} SOL (${fundingFee} funding fee + ${initialBuy} initial buy)`,
    )

    try {
      // TODO: Implement proper RevShare SDK integration with client-side wallet signing

      // Simulate token creation delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate a mock mint address for demonstration
      const mockMintAddress = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
      const mockTransactionSignature = `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`

      console.log("[v0] Mock token created successfully")

      await sql`
        INSERT INTO tokens (
          mint_address,
          name,
          ticker,
          description,
          image_url,
          website,
          twitter,
          telegram,
          visible,
          decimals,
          tax_tier,
          initial_buy,
          reward_ca,
          mode,
          dev_fee_percentage,
          bonding_curve_type,
          developer_wallet,
          transaction_signature,
          nsfw,
          created_at,
          updated_at
        ) VALUES (
          ${mockMintAddress},
          ${name},
          ${ticker},
          ${description},
          ${imageUrl || null},
          ${website || null},
          ${twitter || null},
          ${telegram || null},
          ${visible},
          ${decimals},
          ${taxTier},
          ${Number.parseFloat(initialBuy.toString())},
          ${reward_ca},
          ${mode},
          ${dev_fee_percentage},
          ${bondingCurveType},
          ${developerWallet},
          ${mockTransactionSignature},
          ${finalNsfwFlag},
          NOW(),
          NOW()
        )
      `
      console.log(`Token saved to database successfully${finalNsfwFlag ? " (marked as NSFW)" : ""}`)

      return NextResponse.json({
        success: true,
        mintAddress: mockMintAddress,
        transactionSignature: mockTransactionSignature,
        message: `Token created successfully${finalNsfwFlag ? " (marked as NSFW)" : ""} (Mock Implementation - RevShare SDK integration pending)`,
        totalCost: totalCost,
        isNSFW: finalNsfwFlag, // Include final NSFW status in response
        nsfwReasons: finalNsfwFlag ? nsfwDetection.reasons : undefined,
        breakdown: {
          fundingFee: fundingFee,
          initialBuy: Number.parseFloat(initialBuy.toString()),
        },
      })

      /* 
      // TODO: Implement actual RevShare SDK integration
      // This requires proper client-side transaction signing
      
      // Initialize RevShare SDK
      const revshare = new RevShareSDK()

      // Create token using RevShare SDK
      const result = await revshare.createBondingToken({
        // keypair should be handled client-side for security
        developerWallet: developerWallet,
        name: name,
        ticker: ticker,
        description: description,
        imageUrl: imageUrl || undefined,
        website: website || undefined,
        twitter: twitter || undefined,
        telegram: telegram || undefined,
        visible: visible,
        decimals: decimals,
        taxTier: taxTier,
        initialBuy: Number.parseFloat(initialBuy.toString()),
        reward_ca: reward_ca,
        mode: mode,
        dev_fee_percentage: dev_fee_percentage,
        bondingCurveType: bondingCurveType,
        ref: ref || undefined,
      })
      */
    } catch (revshareError) {
      console.error("RevShare SDK error:", revshareError)

      // Handle specific RevShare errors
      if (revshareError instanceof Error) {
        if (revshareError.message.includes("insufficient funds") || revshareError.message.includes("balance")) {
          return NextResponse.json(
            {
              message: `Insufficient SOL balance. You need at least ${totalCost} SOL (${fundingFee} funding fee + ${initialBuy} initial buy)`,
              requiredAmount: totalCost,
              breakdown: {
                fundingFee: fundingFee,
                initialBuy: Number.parseFloat(initialBuy.toString()),
              },
            },
            { status: 400 },
          )
        }

        return NextResponse.json({ message: `Token creation failed: ${revshareError.message}` }, { status: 500 })
      }

      return NextResponse.json({ message: "Token creation failed with RevShare SDK" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error creating token:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to create token" },
      { status: 500 },
    )
  }
}

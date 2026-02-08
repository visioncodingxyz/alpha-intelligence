import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { detectNSFWTokenEnhanced } from "@/lib/enhanced-nsfw-detector"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      mintAddress,
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
      developerWallet,
      transactionSignature,
      nsfwMode, // Accept NSFW mode from AI generation
    } = body

    // Validate required fields
    if (!mintAddress || !name || !ticker || !description || !developerWallet) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    console.log("[v0] Saving token to database:", {
      mintAddress,
      name,
      ticker,
      transactionSignature,
      nsfwMode, // Log NSFW mode
    })

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
      console.log(`[v0] Token "${name}" will be marked as NSFW:`, {
        aiGeneratedNsfw: nsfwMode,
        contentDetectedNsfw: nsfwDetection.isNSFW,
        reasons: nsfwDetection.reasons,
      })
    }

    // Save to database
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
        ${mintAddress},
        ${name},
        ${ticker},
        ${description},
        ${imageUrl},
        ${website},
        ${twitter},
        ${telegram},
        ${visible},
        ${decimals},
        ${taxTier},
        ${Number.parseFloat(initialBuy.toString())},
        ${reward_ca},
        ${mode},
        ${dev_fee_percentage},
        ${bondingCurveType},
        ${developerWallet},
        ${transactionSignature},
        ${finalNsfwFlag},
        NOW(),
        NOW()
      )
    `

    console.log(`[v0] Token saved to database successfully${finalNsfwFlag ? " (marked as NSFW)" : ""}`)

    return NextResponse.json({
      success: true,
      message: `Token saved to database successfully${finalNsfwFlag ? " (marked as NSFW)" : ""}`,
      isNSFW: finalNsfwFlag,
      nsfwReasons: finalNsfwFlag ? nsfwDetection.reasons : undefined,
    })
  } catch (error) {
    console.error("[v0] Error saving token to database:", error)
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to save token" },
      { status: 500 },
    )
  }
}

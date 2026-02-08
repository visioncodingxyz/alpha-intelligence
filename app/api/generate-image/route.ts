import { detectNSFWGalleryItemEnhanced } from "@/lib/enhanced-nsfw-detector"
import { sql } from "@vercel/postgres"

export async function POST(req: Request) {
  try {
    const {
      prompt,
      negativePrompt,
      style,
      poses,
      filter,
      emotion,
      quality,
      imageSize,
      detail,
      creativity,
      restoreFaces,
      ageSlider,
      weightSlider,
      breastSlider,
      assSlider,
      seed,
      nsfwMode, // Added nsfwMode parameter to determine which API to use
    } = await req.json()

    const walletAddress = req.headers.get("x-wallet-address") || undefined
    const isVideo = false

    console.log(`[v0] Image generation - Starting with prompt: "${prompt}"`)
    console.log(`[v0] Image generation - NSFW Mode:`, nsfwMode)
    console.log(`[v0] Image generation - Wallet address from header:`, walletAddress || "NOT PROVIDED")
    console.log(`[v0] Image generation - Wallet address length:`, walletAddress?.length || 0)
    console.log(`[v0] Image generation - Quality: ${quality || "Ultra"}`)

    let currentCredits = 0
    if (walletAddress) {
      try {
        console.log(`[v0] Image generation - Querying database for wallet: ${walletAddress}`)
        const result = await sql`
          SELECT wallet_address, credit_balance, created_at FROM users WHERE wallet_address = ${walletAddress}
        `
        console.log(`[v0] Image generation - Database query returned ${result.rows.length} rows`)

        if (result.rows.length > 0) {
          currentCredits = result.rows[0].credit_balance || 0
          console.log(`[v0] Image generation - User found in database:`, {
            wallet: result.rows[0].wallet_address,
            credits: currentCredits,
            created: result.rows[0].created_at,
          })
        } else {
          console.log(`[v0] Image generation - No user found for wallet ${walletAddress}, creating user with 5 credits`)
          const insertResult = await sql`
            INSERT INTO users (wallet_address, credit_balance, created_at)
            VALUES (${walletAddress}, 5, NOW())
            ON CONFLICT (wallet_address) DO UPDATE SET wallet_address = ${walletAddress}
            RETURNING wallet_address, credit_balance
          `
          currentCredits = insertResult.rows[0]?.credit_balance || 5
          console.log(`[v0] Image generation - User created successfully:`, {
            wallet: insertResult.rows[0]?.wallet_address,
            credits: currentCredits,
          })
        }
      } catch (dbError) {
        console.error(`[v0] Image generation - Database error:`, dbError)
        console.error(`[v0] Image generation - Error details:`, {
          name: dbError instanceof Error ? dbError.name : "Unknown",
          message: dbError instanceof Error ? dbError.message : String(dbError),
        })
        return Response.json(
          {
            error: "DATABASE_ERROR",
            message: "Failed to check credits. Please try again.",
          },
          { status: 500 },
        )
      }
    }

    const { CreditManager } = await import("@/lib/credit-system")
    const requiredCredits = CreditManager.getCreditCost(quality || "Ultra", isVideo)

    console.log(`[v0] Image generation - Credit check:`, {
      required: requiredCredits,
      current: currentCredits,
      hasWallet: !!walletAddress,
      canAfford: currentCredits >= requiredCredits,
    })

    if (walletAddress && currentCredits < requiredCredits) {
      console.log(`[v0] Image generation - INSUFFICIENT CREDITS - Returning 402 error`)
      return Response.json(
        {
          error: "INSUFFICIENT_CREDITS",
          message: `Insufficient credits for ${quality || "Ultra"} quality. You have ${currentCredits} credits but need ${requiredCredits}.`,
          currentCredits,
          requiredCredits,
        },
        { status: 402 },
      )
    }

    if (walletAddress) {
      try {
        const deductResult = await sql`
          UPDATE users 
          SET credit_balance = credit_balance - ${requiredCredits}
          WHERE wallet_address = ${walletAddress} AND credit_balance >= ${requiredCredits}
          RETURNING credit_balance
        `

        if (deductResult.rows.length === 0) {
          console.log(`[v0] Image generation - Failed to deduct credits (insufficient or user not found)`)
          return Response.json(
            {
              error: "CREDIT_DEDUCTION_FAILED",
              message: "Failed to deduct credits. Please try again.",
            },
            { status: 500 },
          )
        }

        const newBalance = deductResult.rows[0].credit_balance
        console.log(`[v0] Image generation - Credits deducted successfully. New balance: ${newBalance}`)
      } catch (dbError) {
        console.error(`[v0] Image generation - Error deducting credits:`, dbError)
        return Response.json(
          {
            error: "CREDIT_DEDUCTION_FAILED",
            message: "Failed to deduct credits. Please try again.",
          },
          { status: 500 },
        )
      }
    }

    if (!nsfwMode) {
      // Use DALL-E 3 for non-NSFW content
      console.log("[v0] Image generation - Using DALL-E 3 for non-NSFW content")

      const openaiApiKey = process.env.OPENAI_API_KEY
      if (!openaiApiKey) {
        // Refund credits if API key is missing
        if (walletAddress) {
          await sql`
            UPDATE users 
            SET credit_balance = credit_balance + ${requiredCredits}
            WHERE wallet_address = ${walletAddress}
          `
        }
        return Response.json(
          {
            error: "NO_API_KEY",
            message: "OpenAI API key is required for non-NSFW content generation.",
          },
          { status: 400 },
        )
      }

      try {
        const dalleResponse = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: prompt,
            n: 1,
            size: "1024x1024",
            quality: quality === "Max" ? "hd" : "standard",
          }),
        })

        if (!dalleResponse.ok) {
          const errorData = await dalleResponse.json()
          console.error("[v0] DALL-E 3 API error:", errorData)

          // Refund credits on error
          if (walletAddress) {
            await sql`
              UPDATE users 
              SET credit_balance = credit_balance + ${requiredCredits}
              WHERE wallet_address = ${walletAddress}
            `
          }

          return Response.json(
            {
              error: "API_ERROR",
              message: errorData.error?.message || "Failed to generate image with DALL-E",
            },
            { status: dalleResponse.status },
          )
        }

        const dalleData = await dalleResponse.json()
        const imageUrl = dalleData.data[0]?.url

        if (!imageUrl) {
          // Refund credits if no image URL
          if (walletAddress) {
            await sql`
              UPDATE users 
              SET credit_balance = credit_balance + ${requiredCredits}
              WHERE wallet_address = ${walletAddress}
            `
          }
          return Response.json(
            {
              error: "NO_IMAGE",
              message: "No image URL received from DALL-E",
            },
            { status: 500 },
          )
        }

        console.log("[v0] DALL-E 3 - Image generated successfully")

        return Response.json({
          imageUrl: imageUrl,
          prompt: prompt,
          model: "dall-e-3",
          nsfw: false,
          parameters: {
            quality,
          },
        })
      } catch (error) {
        console.error("[v0] DALL-E 3 API network error:", error)

        // Refund credits on network error
        if (walletAddress) {
          await sql`
            UPDATE users 
            SET credit_balance = credit_balance + ${requiredCredits}
            WHERE wallet_address = ${walletAddress}
          `
        }

        return Response.json(
          {
            error: "NETWORK_ERROR",
            message: "Network error while connecting to DALL-E API",
          },
          { status: 500 },
        )
      }
    }

    console.log("[v0] Image generation - Using PromptChan for NSFW content")

    const PROMPTCHAN_API_KEY = process.env.PROMPTCHAN_API_KEY

    if (!PROMPTCHAN_API_KEY) {
      // Refund credits if API key is missing
      if (walletAddress) {
        await sql`
          UPDATE users 
          SET credit_balance = credit_balance + ${requiredCredits}
          WHERE wallet_address = ${walletAddress}
        `
      }

      return Response.json(
        {
          error: "NO_API_KEY",
          message: "Promptchan API key is required for NSFW content generation.",
        },
        { status: 400 },
      )
    }

    const promptchanPayload: any = {
      prompt: prompt,
      style: style || "Cinematic",
      poses: poses || "Default",
      filter: filter || "Default",
      emotion: emotion || "Default",
      quality: quality || "Ultra",
      image_size: imageSize || "512x512",
      age_slider: Math.max(18, ageSlider || 25),
      seed: seed || Math.floor(Math.random() * 1000000),
    }

    // Add optional parameters
    if (negativePrompt) {
      promptchanPayload.negative_prompt = negativePrompt
    }

    if (detail !== undefined && detail !== null) {
      promptchanPayload.detail = detail
    }

    if (creativity !== undefined && creativity !== null) {
      promptchanPayload.creativity = creativity
    }

    if (restoreFaces) {
      promptchanPayload.restore_faces = true
    }

    if (weightSlider !== undefined && weightSlider !== null) {
      promptchanPayload.weight_slider = weightSlider
    }

    if (breastSlider !== undefined && breastSlider !== null) {
      promptchanPayload.breast_slider = breastSlider
    }

    if (assSlider !== undefined && assSlider !== null) {
      promptchanPayload.ass_slider = assSlider
    }

    try {
      const response = await fetch("https://prod.aicloudnetservices.com/api/external/create", {
        method: "POST",
        headers: {
          "x-api-key": PROMPTCHAN_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(promptchanPayload),
      })

      if (response.ok) {
        const data = await response.json()

        let nsfwAnalysis
        try {
          nsfwAnalysis = await detectNSFWGalleryItemEnhanced(
            prompt || "",
            data.image,
            "image",
            "generated_image.jpg",
            "AI generated content",
          )
        } catch (nsfwError) {
          console.error("[v0] NSFW analysis failed:", nsfwError)
          nsfwAnalysis = {
            isNSFW: true,
            confidence: 0.9,
            reasons: ["Generated in NSFW mode"],
            moderationAction: "allow" as const,
            shouldStore: true,
          }
        }

        return Response.json({
          imageUrl: data.image,
          prompt: prompt,
          model: "promptchan-ai",
          nsfw: true,
          nsfwReasons: nsfwAnalysis.reasons,
          nsfwConfidence: nsfwAnalysis.confidence,
          moderationAction: "allow",
          parameters: {
            style,
            poses,
            filter,
            emotion,
            quality,
            imageSize,
            detail,
            creativity,
            restoreFaces,
            seed: promptchanPayload.seed,
          },
        })
      } else {
        const errorText = await response.text()
        console.error("[v0] PromptChan API error:", errorText)

        // Refund credits on error
        if (walletAddress) {
          await sql`
            UPDATE users 
            SET credit_balance = credit_balance + ${requiredCredits}
            WHERE wallet_address = ${walletAddress}
          `
        }

        return Response.json(
          {
            error: "API_ERROR",
            message: "Failed to generate image with PromptChan",
          },
          { status: response.status },
        )
      }
    } catch (error) {
      console.error("[v0] PromptChan API network error:", error)

      // Refund credits on network error
      if (walletAddress) {
        await sql`
          UPDATE users 
          SET credit_balance = credit_balance + ${requiredCredits}
          WHERE wallet_address = ${walletAddress}
        `
      }

      return Response.json(
        {
          error: "NETWORK_ERROR",
          message: "Network error while connecting to PromptChan API",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] General error generating image:", error)
    return Response.json(
      {
        error: "INTERNAL_ERROR",
        message: "Internal server error occurred while generating image",
      },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { neon } from "@neondatabase/serverless"

const IMAGE_GENERATION_COST = 1 // 1 credit per image generation

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { prompt, style, nsfwMode } = body
    const walletAddress = request.headers.get("x-wallet-address") || undefined

    console.log("[v0] Generate NFT Image - Request:", { prompt: prompt?.substring(0, 50), style, nsfwMode })

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    let currentCredits = 0
    const sql = neon(process.env.DATABASE_URL!)

    if (walletAddress) {
      console.log("[v0] Generate NFT Image - Checking credits for wallet:", walletAddress)

      const userResult = await sql`
        SELECT credit_balance FROM users WHERE wallet_address = ${walletAddress}
      `

      if (userResult.length === 0) {
        console.log("[v0] Generate NFT Image - Creating new user")
        await sql`
          INSERT INTO users (wallet_address, credit_balance, created_at, updated_at)
          VALUES (${walletAddress}, 0, NOW(), NOW())
        `
        currentCredits = 0
      } else {
        currentCredits = userResult[0].credit_balance
      }

      console.log("[v0] Generate NFT Image - Current credits:", currentCredits)

      if (currentCredits < IMAGE_GENERATION_COST) {
        return NextResponse.json(
          {
            error: "INSUFFICIENT_CREDITS",
            message: `Insufficient credits for image generation. You have ${currentCredits} credits but need ${IMAGE_GENERATION_COST}.`,
          },
          { status: 402 },
        )
      }

      const updateResult = await sql`
        UPDATE users 
        SET credit_balance = credit_balance - ${IMAGE_GENERATION_COST},
            updated_at = NOW()
        WHERE wallet_address = ${walletAddress}
          AND credit_balance >= ${IMAGE_GENERATION_COST}
        RETURNING credit_balance
      `

      if (updateResult.length === 0) {
        return NextResponse.json(
          {
            error: "INSUFFICIENT_CREDITS",
            message: "Insufficient credits for image generation.",
          },
          { status: 402 },
        )
      }

      console.log("[v0] Generate NFT Image - Credits after deduction:", updateResult[0].credit_balance)
    }

    if (nsfwMode) {
      console.log("[v0] NSFW mode enabled - using Promptchan API")

      const PROMPTCHAN_API_KEY = process.env.PROMPTCHAN_API_KEY

      if (!PROMPTCHAN_API_KEY) {
        return NextResponse.json(
          {
            error: "NO_API_KEY",
            message: "Promptchan API key is required for NSFW mode.",
          },
          { status: 400 },
        )
      }

      const styleMapping: Record<string, string> = {
        realistic: "Hyperreal XL+",
        "digital-art": "Cinematic",
        anime: "Anime XL+",
        "oil-painting": "Oil Painting",
        cyberpunk: "Cyberpunk",
        fantasy: "Fantasy",
        abstract: "Abstract",
      }

      const promptchanPayload = {
        prompt: prompt,
        negative_prompt: "low quality, blurry, distorted, deformed",
        style: styleMapping[style] || "Cinematic",
        poses: "Default",
        filter: "Default",
        emotion: "Default",
        quality: "Ultra",
        image_size: "512x512",
        age_slider: 25,
        weight_slider: 0,
        breast_slider: 0,
        ass_slider: 0,
        seed: Math.floor(Math.random() * 1000000),
      }

      const response = await fetch("https://prod.aicloudnetservices.com/api/external/create", {
        method: "POST",
        headers: {
          "x-api-key": PROMPTCHAN_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(promptchanPayload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Promptchan API error:", errorText)
        return NextResponse.json({ error: "Failed to generate image with Promptchan API" }, { status: 500 })
      }

      const data = await response.json()

      if (!data.image) {
        return NextResponse.json({ error: "No image URL returned from Promptchan API" }, { status: 500 })
      }

      const imageResponse = await fetch(data.image)
      if (!imageResponse.ok) {
        throw new Error("Failed to download generated image from Promptchan")
      }

      const imageBlob = await imageResponse.blob()
      const filename = `nft-nsfw-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
      const blob = await put(filename, imageBlob, {
        access: "public",
        contentType: "image/png",
      })

      console.log("[v0] Generate NFT Image - Image generated successfully with Promptchan")

      return NextResponse.json({
        imageUrl: blob.url,
        prompt: prompt,
        model: "promptchan-ai",
      })
    } else {
      console.log("[v0] SFW mode - using DALL-E")

      const stylePrompts: Record<string, string> = {
        realistic: "photorealistic, highly detailed, professional photography",
        "digital-art": "digital art, vibrant colors, modern illustration",
        anime: "anime style, manga art, Japanese animation",
        "oil-painting": "oil painting, classical art, textured brushstrokes",
        cyberpunk: "cyberpunk aesthetic, neon lights, futuristic, sci-fi",
        fantasy: "fantasy art, magical, epic, detailed illustration",
        abstract: "abstract art, geometric shapes, modern art",
      }

      const enhancedPrompt = `${prompt}, ${stylePrompts[style] || stylePrompts["digital-art"]}, high quality, 4k`

      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("[v0] OpenAI API error:", error)
        return NextResponse.json({ error: "Failed to generate image" }, { status: 500 })
      }

      const data = await response.json()
      const tempImageUrl = data.data[0].url

      const imageResponse = await fetch(tempImageUrl)
      if (!imageResponse.ok) {
        throw new Error("Failed to download generated image")
      }

      const imageBlob = await imageResponse.blob()
      const filename = `nft-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
      const blob = await put(filename, imageBlob, {
        access: "public",
        contentType: "image/png",
      })

      console.log("[v0] Generate NFT Image - Image generated successfully with DALL-E")

      return NextResponse.json({
        imageUrl: blob.url,
        prompt: enhancedPrompt,
        model: "dall-e-3",
      })
    }
  } catch (error) {
    console.error("[v0] Generate NFT Image error:", error)

    const walletAddress = request.headers.get("x-wallet-address")
    if (walletAddress) {
      try {
        const sql = neon(process.env.DATABASE_URL!)
        await sql`
          UPDATE users 
          SET credit_balance = credit_balance + ${IMAGE_GENERATION_COST},
              updated_at = NOW()
          WHERE wallet_address = ${walletAddress}
        `
        console.log("[v0] Generate NFT Image - Credits refunded due to error")
      } catch (refundError) {
        console.error("[v0] Generate NFT Image - Failed to refund credits:", refundError)
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

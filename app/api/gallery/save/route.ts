import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { detectNSFWGalleryItemEnhanced } from "@/lib/enhanced-nsfw-detector"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, prompt, settings, contentType = "image", nsfwMode = false } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "No content URL provided" }, { status: 400 })
    }

    const contentResponse = await fetch(imageUrl)
    if (!contentResponse.ok) {
      throw new Error("Failed to fetch content")
    }

    const contentBuffer = await contentResponse.arrayBuffer()
    const timestamp = Date.now()
    const extension = contentType === "video" ? "mp4" : "jpg"
    const filename = `gallery-${timestamp}.${extension}`

    let isNSFW = nsfwMode
    let nsfwAnalysis

    if (nsfwMode) {
      console.log(`[v0] NSFW mode active - automatically flagging content as NSFW`)
      nsfwAnalysis = {
        isNSFW: true,
        confidence: 1.0,
        moderationAction: "flag",
        shouldStore: true,
        reasons: ["User explicitly enabled NSFW mode"],
      }
    } else {
      nsfwAnalysis = await detectNSFWGalleryItemEnhanced(
        prompt || "",
        imageUrl,
        contentType as "image" | "video",
        filename,
        "gallery save",
      )
      isNSFW = nsfwAnalysis.isNSFW
    }

    console.log(`[v0] Gallery save NSFW analysis:`, {
      nsfwModeActive: nsfwMode,
      isNSFW: isNSFW,
      confidence: nsfwAnalysis.confidence,
      action: nsfwAnalysis.moderationAction,
      shouldStore: nsfwAnalysis.shouldStore,
    })

    const file = new File([contentBuffer], filename, {
      type: contentType === "video" ? "video/mp4" : "image/jpeg",
    })

    const blob = await put(filename, file, {
      access: "public",
    })

    let galleryItem
    try {
      const insertResult = await sql!`
        INSERT INTO gallery_items (id, blob_url, filename, prompt, upvotes, downvotes, created_at, updated_at, vote_ratio, content_type, nsfw)
        VALUES (${timestamp}, ${blob.url}, ${filename}, ${prompt || ""}, 0, 0, ${new Date().toISOString()}, ${new Date().toISOString()}, 0, ${contentType}, ${isNSFW})
        RETURNING id, blob_url, filename, prompt, upvotes, downvotes, created_at, vote_ratio, content_type, nsfw
      `

      galleryItem = {
        id: insertResult[0].id.toString(),
        url: insertResult[0].blob_url,
        originalUrl: imageUrl,
        prompt: insertResult[0].prompt || "",
        settings: settings || {},
        createdAt: insertResult[0].created_at,
        filename: insertResult[0].filename,
        upvotes: insertResult[0].upvotes || 0,
        downvotes: insertResult[0].downvotes || 0,
        voteRatio: insertResult[0].vote_ratio || 0,
        contentType: insertResult[0].content_type || "image",
        nsfw: insertResult[0].nsfw || false,
      }
    } catch (dbError) {
      console.error("Database save error:", dbError)
      galleryItem = {
        id: timestamp.toString(),
        url: blob.url,
        originalUrl: imageUrl,
        prompt: prompt || "",
        settings: settings || {},
        createdAt: new Date().toISOString(),
        filename,
        upvotes: 0,
        downvotes: 0,
        voteRatio: 0,
        contentType: contentType || "image",
        nsfw: isNSFW,
      }
    }

    return NextResponse.json({
      success: true,
      item: galleryItem,
      nsfwDetected: isNSFW,
      nsfwReasons: nsfwAnalysis.reasons,
      nsfwConfidence: nsfwAnalysis.confidence,
      moderationAction: nsfwAnalysis.moderationAction,
      aiAnalysis: nsfwAnalysis.aiAnalysis
        ? {
            categories: nsfwAnalysis.aiAnalysis.categories,
            severity: nsfwAnalysis.aiAnalysis.severity,
            ageAppropriate: nsfwAnalysis.aiAnalysis.ageAppropriate,
          }
        : undefined,
    })
  } catch (error) {
    console.error("Gallery save error:", error)
    return NextResponse.json({ error: "Failed to save to gallery" }, { status: 500 })
  }
}

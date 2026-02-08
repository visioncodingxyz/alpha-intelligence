import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    if (!sql) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not available",
        },
        { status: 500 },
      )
    }

    const result = await sql`
      SELECT id, blob_url, filename, prompt, upvotes, downvotes, created_at, vote_ratio, content_type, nsfw
      FROM gallery_items
      ORDER BY created_at DESC
    `

    const galleryItems = result.map((item) => ({
      id: item.id.toString(),
      url: item.blob_url,
      filename: item.filename,
      prompt: item.prompt || "",
      createdAt: item.created_at,
      upvotes: item.upvotes || 0,
      downvotes: item.downvotes || 0,
      voteRatio: item.vote_ratio || 0,
      contentType: item.content_type || "image",
      nsfw: item.nsfw || false,
    }))

    return NextResponse.json({
      success: true,
      items: galleryItems,
    })
  } catch (error) {
    console.error("[v0] Gallery list error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to list gallery items",
      },
      { status: 500 },
    )
  }
}

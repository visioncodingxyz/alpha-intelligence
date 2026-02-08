import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    const topPhotos = await sql!`
      SELECT id, blob_url, filename, prompt, upvotes, downvotes, vote_ratio, created_at, nsfw
      FROM gallery_items 
      WHERE content_type = 'image'
      ORDER BY vote_ratio DESC, (upvotes + downvotes) DESC
      LIMIT 10
    `

    const items = topPhotos.map((photo) => ({
      id: photo.id.toString(),
      url: photo.blob_url,
      filename: photo.filename,
      prompt: photo.prompt || "",
      upvotes: Number(photo.upvotes),
      downvotes: Number(photo.downvotes),
      voteRatio: Number(photo.vote_ratio),
      createdAt: photo.created_at,
      nsfw: Boolean(photo.nsfw),
    }))

    return NextResponse.json({
      success: true,
      items,
    })
  } catch (error) {
    console.error("Top photos error:", error)
    return NextResponse.json({ error: "Failed to get top photos" }, { status: 500 })
  }
}

import { sql } from "@vercel/postgres"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { imageId, nsfw } = await request.json()

    if (!imageId || typeof nsfw !== "boolean") {
      return NextResponse.json({ success: false, error: "Image ID and NSFW status are required" }, { status: 400 })
    }

    // Update the NSFW status in the database
    await sql`
      UPDATE gallery_items 
      SET nsfw = ${nsfw}
      WHERE id = ${imageId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Toggle NSFW error:", error)
    return NextResponse.json({ success: false, error: "Failed to toggle NSFW status" }, { status: 500 })
  }
}

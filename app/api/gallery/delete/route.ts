import { type NextRequest, NextResponse } from "next/server"
import { del } from "@vercel/blob"
import { sql } from "@/lib/database"

export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }

    await del(url)

    if (sql) {
      try {
        await sql`
          DELETE FROM gallery_items WHERE blob_url = ${url}
        `
      } catch (dbError) {
        console.error("Database delete error:", dbError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Gallery delete error:", error)
    return NextResponse.json({ error: "Failed to delete from gallery" }, { status: 500 })
  }
}

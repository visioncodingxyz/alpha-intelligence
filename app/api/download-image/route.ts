import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, filename, contentType } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: "Content URL is required" }, { status: 400 })
    }

    // Fetch the content from the external URL
    const response = await fetch(imageUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.status}`)
    }

    const contentBuffer = await response.arrayBuffer()

    let finalContentType = response.headers.get("Content-Type")
    let defaultFilename = "generated-content"

    if (contentType === "video") {
      finalContentType = finalContentType || "video/mp4"
      defaultFilename = filename || "generated-video.mp4"
    } else {
      finalContentType = finalContentType || "image/png"
      defaultFilename = filename || "generated-image.png"
    }

    // Return the content with appropriate headers for download
    return new NextResponse(contentBuffer, {
      headers: {
        "Content-Type": finalContentType,
        "Content-Disposition": `attachment; filename="${defaultFilename}"`,
        "Content-Length": contentBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("Error downloading content:", error)
    return NextResponse.json({ error: "Failed to download content" }, { status: 500 })
  }
}

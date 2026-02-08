import { type NextRequest, NextResponse } from "next/server"
import { pinata } from "@/lib/pinata"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    const timestamp = Date.now()
    const extension = file.name.split(".").pop() || "jpg"
    const filename = `token-${timestamp}.${extension}`

    // Upload to Pinata IPFS
    const upload = await pinata.upload.file(file).addMetadata({
      name: filename,
      keyValues: {
        type: "token-image",
        timestamp: timestamp.toString(),
      },
    })

    // Create IPFS URL using the gateway
    const ipfsUrl = `${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}/ipfs/${upload.IpfsHash}`

    return NextResponse.json({
      success: true,
      url: ipfsUrl,
      filename: filename,
      ipfsHash: upload.IpfsHash,
    })
  } catch (error) {
    console.error("Token image upload error:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}

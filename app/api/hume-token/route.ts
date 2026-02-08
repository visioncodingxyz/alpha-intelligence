import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if environment variables are set
    if (!process.env.HUME_API_KEY || !process.env.HUME_SECRET_KEY) {
      console.error("Missing HUME_API_KEY or HUME_SECRET_KEY environment variables")
      return NextResponse.json(
        { error: "Missing Hume AI credentials. Please set HUME_API_KEY and HUME_SECRET_KEY environment variables." },
        { status: 500 },
      )
    }

    console.log("[v0] HUME_API_KEY length:", process.env.HUME_API_KEY.length)
    console.log("[v0] HUME_SECRET_KEY length:", process.env.HUME_SECRET_KEY.length)
    console.log("[v0] API Key starts with:", process.env.HUME_API_KEY.substring(0, 10) + "...")
    console.log("[v0] Secret Key starts with:", process.env.HUME_SECRET_KEY.substring(0, 10) + "...")

    // Use direct API call instead of SDK to avoid potential issues
    const credentials = Buffer.from(`${process.env.HUME_API_KEY}:${process.env.HUME_SECRET_KEY}`).toString("base64")
    console.log("[v0] Base64 credentials length:", credentials.length)

    const response = await fetch("https://api.hume.ai/oauth2-cc/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    })

    console.log("[v0] Response status:", response.status)
    console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Hume API error:", response.status, errorText)
      return NextResponse.json(
        { error: `Failed to authenticate with Hume AI: ${response.status} ${errorText}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    if (!data.access_token) {
      console.error("No access token in response:", data)
      return NextResponse.json({ error: "Invalid response from Hume AI - no access token received" }, { status: 500 })
    }

    console.log("[v0] Successfully obtained access token")
    return NextResponse.json({ accessToken: data.access_token })
  } catch (error) {
    console.error("Failed to fetch Hume AI access token:", error)
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { detectNSFWGalleryItemEnhanced } from "@/lib/enhanced-nsfw-detector"

export async function POST(request: NextRequest) {
  try {
    const { prompt, age_slider, audioEnabled, video_quality, aspect, seed } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    console.log("[v0] Starting video generation with prompt:", prompt)

    if (!process.env.PROMPTCHAN_API_KEY) {
      console.error("[v0] PROMPTCHAN_API_KEY environment variable is not set")
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    const requestBody = {
      age_slider: Math.max(18, Math.min(age_slider || 25, 100)),
      audioEnabled: Boolean(audioEnabled),
      prompt: String(prompt).trim(),
      video_quality: video_quality || "Standard",
      aspect: aspect || "Portrait",
      seed: seed || Math.floor(Math.random() * 1000000),
    }

    console.log("[v0] Request body:", JSON.stringify(requestBody, null, 2))

    const submitResponse = await fetch("https://prod.aicloudnetservices.com/api/external/video_v2/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.PROMPTCHAN_API_KEY,
      },
      body: JSON.stringify(requestBody),
    })

    console.log("[v0] Submit response status:", submitResponse.status)

    const responseText = await submitResponse.text()
    console.log("[v0] Submit response text:", responseText)

    if (!submitResponse.ok) {
      console.error("[v0] Promptchan API submit error - Status:", submitResponse.status)
      console.error("[v0] Promptchan API submit error - Response:", responseText)

      if (submitResponse.status === 401) {
        return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
      } else if (submitResponse.status === 400) {
        return NextResponse.json({ error: `Invalid request: ${responseText}` }, { status: 400 })
      } else {
        return NextResponse.json({ error: `API error: ${responseText}` }, { status: submitResponse.status })
      }
    }

    let submitData
    try {
      if (!responseText.trim()) {
        throw new Error("Empty response")
      }
      submitData = JSON.parse(responseText)
    } catch (parseError) {
      console.error("[v0] Failed to parse submit response as JSON:", parseError)
      return NextResponse.json(
        {
          error: `Invalid JSON response from video API: ${responseText.substring(0, 100)}...`,
        },
        { status: 500 },
      )
    }

    const requestId = submitData.request_id

    if (!requestId) {
      console.error("[v0] No request ID in response:", submitData)
      return NextResponse.json({ error: "No request ID received from API" }, { status: 500 })
    }

    console.log("[v0] Got request ID:", requestId)

    let attempts = 0
    const maxAttempts = 60

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 5000))
      attempts++

      console.log("[v0] Checking status, attempt:", attempts)

      const statusResponse = await fetch(
        `https://prod.aicloudnetservices.com/api/external/video_v2/status/${requestId}`,
        {
          headers: {
            "x-api-key": process.env.PROMPTCHAN_API_KEY,
          },
        },
      )

      if (!statusResponse.ok) {
        console.error("[v0] Status check failed:", statusResponse.status)
        continue
      }

      const statusText = await statusResponse.text()
      console.log("[v0] Status response text:", statusText)

      let statusData
      try {
        if (!statusText.trim()) {
          console.error("[v0] Empty status response")
          continue
        }
        statusData = JSON.parse(statusText)
      } catch (parseError) {
        console.error("[v0] Failed to parse status response as JSON:", parseError)
        continue
      }

      console.log("[v0] Status data:", statusData)

      if (statusData.status === "Completed") {
        console.log("[v0] Video generation completed, fetching result")

        const resultResponse = await fetch(
          `https://prod.aicloudnetservices.com/api/external/video_v2/result/${requestId}`,
          {
            headers: {
              "x-api-key": process.env.PROMPTCHAN_API_KEY,
            },
          },
        )

        if (resultResponse.ok) {
          const resultText = await resultResponse.text()
          console.log("[v0] Result response text:", resultText)

          let resultData
          try {
            if (!resultText.trim()) {
              throw new Error("Empty result response")
            }
            resultData = JSON.parse(resultText)
          } catch (parseError) {
            console.error("[v0] Failed to parse result response as JSON:", parseError)
            return NextResponse.json({ error: "Invalid result response from video API" }, { status: 500 })
          }

          console.log("[v0] Result data:", resultData)

          if (resultData.status === "success" && resultData.video && resultData.video.length > 0) {
            const videoUrl = resultData.video[0]
            console.log("[v0] Video generation successful:", videoUrl)

            const nsfwAnalysis = await detectNSFWGalleryItemEnhanced(
              prompt || "",
              videoUrl, // Analyze the actual generated video
              "video",
              "generated_video.mp4",
              "AI generated video content",
            )

            console.log(`[v0] Enhanced video NSFW analysis completed:`, {
              isNSFW: nsfwAnalysis.isNSFW,
              confidence: nsfwAnalysis.confidence,
              action: nsfwAnalysis.moderationAction,
              hasAI: !!nsfwAnalysis.aiAnalysis,
            })

            return NextResponse.json({
              success: true,
              videoUrl,
              requestId,
              nsfw: nsfwAnalysis.isNSFW,
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
          } else {
            console.error("[v0] Invalid result data structure:", resultData)
            return NextResponse.json({ error: "Invalid video result data" }, { status: 500 })
          }
        } else {
          const errorText = await resultResponse.text()
          console.error("[v0] Result fetch failed:", resultResponse.status, errorText)
          return NextResponse.json({ error: "Failed to fetch video result" }, { status: 500 })
        }
      } else if (statusData.status === "Failed") {
        console.error("[v0] Video generation failed")
        return NextResponse.json({ error: "Video generation failed" }, { status: 500 })
      }

      console.log("[v0] Status:", statusData.status, "- continuing to poll")
    }

    console.error("[v0] Video generation timed out after", maxAttempts, "attempts")
    return NextResponse.json({ error: "Video generation timed out" }, { status: 408 })
  } catch (error) {
    console.error("[v0] Video generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

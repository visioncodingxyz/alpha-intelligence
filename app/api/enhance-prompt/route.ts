import { generateText } from "ai"
import { openrouter } from "@openrouter/ai-sdk-provider"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt, nsfwMode } = await request.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const systemPrompt = nsfwMode
      ? `You are an expert prompt engineer for AI image generation. Your task is to enhance and improve user prompts to create more detailed, vivid, and engaging descriptions for NSFW/adult content generation.

Guidelines:
- Keep the core concept and intent of the original prompt
- Add specific details about lighting, composition, mood, and visual elements
- Include artistic style references when appropriate
- Make the prompt more descriptive and engaging
- Ensure the enhanced prompt is suitable for adult/NSFW content generation
- Keep it concise but detailed (aim for 2-3 sentences)
- Focus on visual elements that will improve image quality

Original prompt: ${prompt}

Provide only the enhanced prompt, no explanations or additional text.`
      : `You are an expert prompt engineer for AI image generation. Your task is to enhance and improve user prompts to create more detailed, vivid, and engaging descriptions for safe-for-work content generation.

Guidelines:
- Keep the core concept and intent of the original prompt
- Add specific details about lighting, composition, mood, and visual elements
- Include artistic style references when appropriate
- Make the prompt more descriptive and engaging
- Ensure the content remains appropriate and safe-for-work
- Keep it concise but detailed (aim for 2-3 sentences)
- Focus on visual elements that will improve image quality

Original prompt: ${prompt}

Provide only the enhanced prompt, no explanations or additional text.`

    const { text: enhancedPrompt } = await generateText({
      model: openrouter("meta-llama/llama-3.3-70b-instruct", {
        apiKey: process.env.OPENROUTER_API_KEY,
      }),
      prompt: systemPrompt,
      maxTokens: 200,
      temperature: 0.7,
    })

    if (!enhancedPrompt) {
      throw new Error("No enhanced prompt received from OpenRouter API")
    }

    return NextResponse.json({ enhancedPrompt: enhancedPrompt.trim() })
  } catch (error) {
    console.error("Error enhancing prompt:", error)
    return NextResponse.json(
      { error: "Failed to enhance prompt", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

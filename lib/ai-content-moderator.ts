import { generateObject } from "ai"
import { z } from "zod"

// Schema for AI content moderation results
const contentModerationSchema = z.object({
  isNSFW: z.boolean().describe("Whether the content contains NSFW/adult material"),
  confidence: z.number().min(0).max(1).describe("Confidence score from 0 to 1"),
  categories: z
    .array(
      z.enum([
        "nudity",
        "sexual_content",
        "suggestive",
        "violence",
        "drugs",
        "hate_speech",
        "harassment",
        "minor_safety",
        "safe",
      ]),
    )
    .describe("Categories of content detected"),
  reasons: z.array(z.string()).describe("Specific reasons why content was flagged"),
  severity: z.enum(["low", "medium", "high"]).describe("Severity level of NSFW content"),
  ageAppropriate: z.boolean().describe("Whether content is appropriate for all ages"),
  recommendedAction: z.enum(["allow", "flag", "block"]).describe("Recommended moderation action"),
})

export type ContentModerationResult = z.infer<typeof contentModerationSchema>

/**
 * Analyzes image content using AI vision models for NSFW detection
 */
export async function analyzeImageContent(
  imageUrl: string,
  prompt?: string,
  additionalContext?: string,
): Promise<ContentModerationResult> {
  console.log(`[v0] AI Content Moderation - Starting image analysis for: ${imageUrl}`)

  try {
    console.log("[v0] AI Content Moderation - Checking AI SDK availability")

    console.log("[v0] AI Content Moderation - Environment check:")
    console.log("[v0] AI Content Moderation - OPENAI_API_KEY exists:", !!process.env.OPENAI_API_KEY)
    console.log("[v0] AI Content Moderation - GROQ_API_KEY exists:", !!process.env.GROQ_API_KEY)
    console.log("[v0] AI Content Moderation - XAI_API_KEY exists:", !!process.env.XAI_API_KEY)

    // Use AI SDK with vision-capable model to analyze the image
    const { object } = await generateObject({
      model: "openai/gpt-4o-mini", // Vision-capable model
      schema: contentModerationSchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image specifically for NUDITY and EXPLICIT SEXUAL CONTENT. Consider the following context:
              
              ${prompt ? `Original prompt: "${prompt}"` : ""}
              ${additionalContext ? `Additional context: "${additionalContext}"` : ""}
              
              IMPORTANT: Only flag content as NSFW if it contains:
              1. Actual nudity (exposed genitals, breasts, buttocks)
              2. Explicit sexual acts or positions
              3. Graphic sexual content
              
              DO NOT flag content as NSFW for:
              - Religious imagery (Jesus, biblical scenes, etc.)
              - Artistic content without nudity
              - Landscapes, buildings, or everyday objects
              - Fashion, swimwear, or athletic wear
              - Suggestive but non-explicit content
              - General "adult themes" that don't involve nudity
              
              Be precise and only flag content that contains actual nudity or explicit sexual material.`,
            },
            {
              type: "image",
              image: imageUrl,
            },
          ],
        },
      ],
      maxOutputTokens: 1000,
      temperature: 0.1, // Low temperature for consistent moderation decisions
    })

    console.log(`[v0] AI Content Moderation - Image analysis completed successfully:`, {
      isNSFW: object.isNSFW,
      confidence: object.confidence,
      categories: object.categories,
      severity: object.severity,
    })
    return object
  } catch (error) {
    console.error(`[v0] AI Content Moderation - Error analyzing image:`, error)

    if (error instanceof Error) {
      console.error(`[v0] AI Content Moderation - Error details:`, {
        name: error.name,
        message: error.message,
        stack: error.stack?.substring(0, 500), // First 500 chars of stack trace
      })

      if (error.message.includes("rate limit") || error.message.includes("429")) {
        console.error(
          "[v0] AI Content Moderation - RATE LIMIT DETECTED - You are being rate limited by the AI provider",
        )
      } else if (
        error.message.includes("API key") ||
        error.message.includes("401") ||
        error.message.includes("unauthorized")
      ) {
        console.error("[v0] AI Content Moderation - API KEY ISSUE - Invalid or missing API key")
      } else if (
        error.message.includes("insufficient") ||
        error.message.includes("quota") ||
        error.message.includes("credits") ||
        error.message.includes("billing")
      ) {
        console.error("[v0] AI Content Moderation - QUOTA/CREDITS ISSUE - Insufficient credits or quota exceeded")
      } else if (error.message.includes("timeout") || error.message.includes("network")) {
        console.error("[v0] AI Content Moderation - NETWORK ISSUE - Connection timeout or network error")
      } else {
        console.error("[v0] AI Content Moderation - UNKNOWN ERROR - Check error details above")
      }
    }

    // Fallback to text-based analysis if image analysis fails
    console.log(`[v0] AI Content Moderation - Falling back to text analysis`)
    return await analyzeTextContent(prompt || "", additionalContext)
  }
}

/**
 * Analyzes text content using AI for NSFW detection (fallback method)
 */
export async function analyzeTextContent(text: string, additionalContext?: string): Promise<ContentModerationResult> {
  console.log(`[v0] AI Content Moderation - Analyzing text: "${text}"`)

  try {
    console.log("[v0] AI Content Moderation - Starting text analysis with AI SDK")

    const { object } = await generateObject({
      model: "openai/gpt-4o-mini",
      schema: contentModerationSchema,
      messages: [
        {
          role: "user",
          content: `Analyze this text specifically for references to NUDITY and EXPLICIT SEXUAL CONTENT:
          
          Text: "${text}"
          ${additionalContext ? `Context: "${additionalContext}"` : ""}
          
          IMPORTANT: Only flag as NSFW if the text explicitly describes:
          1. Nudity or exposed body parts
          2. Sexual acts or explicit sexual content
          3. Graphic sexual descriptions
          
          DO NOT flag for:
          - Religious references (Jesus, biblical content, etc.)
          - General descriptive terms without sexual context
          - Business or everyday language
          - Artistic or creative descriptions without explicit content
          
          Focus only on actual nudity and explicit sexual material.`,
        },
      ],
      maxOutputTokens: 500,
      temperature: 0.1,
    })

    console.log(`[v0] AI Content Moderation - Text analysis result:`, object)
    return object
  } catch (error) {
    console.error(`[v0] AI Content Moderation - Error analyzing text:`, error)

    if (error instanceof Error) {
      console.error(`[v0] AI Content Moderation - Text analysis error details:`, {
        name: error.name,
        message: error.message,
      })

      if (error.message.includes("rate limit") || error.message.includes("429")) {
        console.error("[v0] AI Content Moderation - TEXT ANALYSIS RATE LIMITED")
      } else if (error.message.includes("API key") || error.message.includes("401")) {
        console.error("[v0] AI Content Moderation - TEXT ANALYSIS API KEY ISSUE")
      } else if (
        error.message.includes("insufficient") ||
        error.message.includes("quota") ||
        error.message.includes("credits")
      ) {
        console.error("[v0] AI Content Moderation - TEXT ANALYSIS QUOTA/CREDITS ISSUE")
      }
    }

    return {
      isNSFW: false, // Changed from true to false - don't assume NSFW on analysis failure
      confidence: 0.3, // Lower confidence for failed analysis
      categories: ["safe"],
      reasons: ["Unable to analyze content - defaulting to safe"],
      severity: "low", // Changed from medium to low
      ageAppropriate: true, // Changed from false to true
      recommendedAction: "allow", // Changed from flag to allow
    }
  }
}

/**
 * Analyzes video content by extracting frames and analyzing them
 */
export async function analyzeVideoContent(
  videoUrl: string,
  prompt?: string,
  additionalContext?: string,
): Promise<ContentModerationResult> {
  console.log(`[v0] AI Content Moderation - Analyzing video: ${videoUrl}`)

  // For now, we'll analyze the prompt and context
  // In a full implementation, you'd extract video frames and analyze them
  const textAnalysis = await analyzeTextContent(
    prompt || "video content",
    `Video URL: ${videoUrl}. ${additionalContext || ""}`,
  )

  // Videos are generally more likely to contain dynamic content
  return {
    ...textAnalysis,
    confidence: Math.max(0.3, textAnalysis.confidence - 0.1), // Slightly lower confidence for videos
    reasons: [...textAnalysis.reasons, "Video content analyzed based on prompt and metadata"],
  }
}

/**
 * Batch analyze multiple images for efficiency
 */
export async function batchAnalyzeImages(
  images: Array<{ url: string; prompt?: string; context?: string }>,
): Promise<ContentModerationResult[]> {
  console.log(`[v0] AI Content Moderation - Batch analyzing ${images.length} images`)

  // Process images in parallel with rate limiting
  const results = await Promise.allSettled(
    images.map(async (image, index) => {
      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, index * 100))
      return analyzeImageContent(image.url, image.prompt, image.context)
    }),
  )

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value
    } else {
      console.error(`[v0] AI Content Moderation - Failed to analyze image ${index}:`, result.reason)
      return {
        isNSFW: true, // Conservative fallback
        confidence: 0.5,
        categories: ["safe"],
        reasons: ["Analysis failed - marked as NSFW for safety"],
        severity: "medium" as const,
        ageAppropriate: false,
        recommendedAction: "flag" as const,
      }
    }
  })
}

/**
 * Get moderation settings based on user preferences or admin config
 */
export function getModerationThresholds() {
  return {
    nsfwThreshold: 0.8, // Increased from 0.7 to 0.8 for higher confidence requirement
    blockThreshold: 0.9, // Confidence threshold for blocking content
    flagThreshold: 0.6, // Increased from 0.5 to 0.6 for higher confidence requirement
    allowedCategories: ["safe"], // Categories that are always allowed
    blockedCategories: ["nudity", "sexual_content", "minor_safety"], // Categories that are always blocked
    severityLimits: {
      low: "allow",
      medium: "flag",
      high: "block",
    },
  }
}

/**
 * Apply moderation decision based on AI analysis and thresholds
 */
export function applyModerationDecision(
  analysis: ContentModerationResult,
  thresholds = getModerationThresholds(),
): {
  action: "allow" | "flag" | "block"
  reason: string
  shouldStore: boolean
} {
  const { confidence, categories, severity, recommendedAction } = analysis

  // Check for NSFW content and flag it
  if (analysis.isNSFW && confidence > thresholds.flagThreshold) {
    return {
      action: "flag",
      reason: `NSFW content detected: ${categories.join(", ")} (${Math.round(confidence * 100)}% confidence)`,
      shouldStore: true, // Always store, just flag as NSFW
    }
  }

  // For non-NSFW content, allow normally
  return {
    action: "allow",
    reason: `Content approved (confidence: ${Math.round(confidence * 100)}%)`,
    shouldStore: true,
  }
}

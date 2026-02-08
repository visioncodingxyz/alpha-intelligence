// Enhanced NSFW detector that combines AI analysis with existing text-based detection
import { detectNSFWContent as detectNSFWText } from "./nsfw-detector"
import {
  analyzeImageContent,
  analyzeTextContent,
  analyzeVideoContent,
  applyModerationDecision,
  type ContentModerationResult,
} from "./ai-content-moderator"

export interface EnhancedNSFWResult {
  isNSFW: boolean
  confidence: number
  reasons: string[]
  aiAnalysis?: ContentModerationResult
  textAnalysis?: {
    isNSFW: boolean
    confidence: number
    reasons: string[]
  }
  moderationAction: "allow" | "flag" | "block"
  shouldStore: boolean
}

/**
 * Enhanced NSFW detection that combines AI image analysis with text analysis
 */
export async function detectNSFWContentEnhanced(
  text: string,
  imageUrl?: string,
  contentType: "image" | "video" | "text" = "text",
  additionalContext?: string,
): Promise<EnhancedNSFWResult> {
  console.log(`[v0] Enhanced NSFW Detection - Analyzing ${contentType} content`)

  // Always run text-based analysis first (fast and reliable)
  const textAnalysis = detectNSFWText(text, additionalContext)

  let aiAnalysis: ContentModerationResult | undefined

  // Run AI analysis if we have visual content
  if (imageUrl) {
    try {
      if (contentType === "image") {
        aiAnalysis = await analyzeImageContent(imageUrl, text, additionalContext)
      } else if (contentType === "video") {
        aiAnalysis = await analyzeVideoContent(imageUrl, text, additionalContext)
      }
    } catch (error) {
      console.error(`[v0] Enhanced NSFW Detection - AI analysis failed:`, error)
      // Fall back to text-only analysis
      aiAnalysis = await analyzeTextContent(text, additionalContext)
    }
  } else {
    // No visual content, use AI text analysis for better accuracy
    try {
      aiAnalysis = await analyzeTextContent(text, additionalContext)
    } catch (error) {
      console.error(`[v0] Enhanced NSFW Detection - AI text analysis failed:`, error)
    }
  }

  // Combine results - AI analysis takes precedence if available
  let finalResult: EnhancedNSFWResult

  if (aiAnalysis) {
    const moderationDecision = applyModerationDecision(aiAnalysis)

    finalResult = {
      isNSFW: aiAnalysis.isNSFW,
      confidence: aiAnalysis.confidence,
      reasons: aiAnalysis.reasons,
      aiAnalysis,
      textAnalysis,
      moderationAction: moderationDecision.action,
      shouldStore: moderationDecision.shouldStore,
    }
  } else {
    // Fallback to text-only analysis
    finalResult = {
      isNSFW: textAnalysis.isNSFW,
      confidence: textAnalysis.confidence,
      reasons: textAnalysis.reasons,
      textAnalysis,
      moderationAction: textAnalysis.isNSFW ? "flag" : "allow",
      shouldStore: true, // Always store content, just flag as needed
    }
  }

  console.log(`[v0] Enhanced NSFW Detection - Final result:`, {
    isNSFW: finalResult.isNSFW,
    confidence: finalResult.confidence,
    action: finalResult.moderationAction,
    hasAI: !!aiAnalysis,
    hasText: !!textAnalysis,
  })

  return finalResult
}

/**
 * Specialized function for gallery content with enhanced AI analysis
 */
export async function detectNSFWGalleryItemEnhanced(
  prompt: string,
  imageUrl?: string,
  contentType: "image" | "video" = "image",
  filename?: string,
  additionalMetadata?: string,
): Promise<EnhancedNSFWResult> {
  const context = [filename, additionalMetadata, "gallery content"].filter(Boolean).join(", ")

  return detectNSFWContentEnhanced(prompt, imageUrl, contentType, context)
}

/**
 * Specialized function for token content with enhanced AI analysis
 */
export async function detectNSFWTokenEnhanced(
  name: string,
  ticker: string,
  description: string,
  imageUrl?: string,
  additionalContext?: string,
): Promise<EnhancedNSFWResult> {
  const combinedText = `${name} ${ticker} ${description}`
  const context = [additionalContext, "token creation"].filter(Boolean).join(", ")

  return detectNSFWContentEnhanced(combinedText, imageUrl, "image", context)
}

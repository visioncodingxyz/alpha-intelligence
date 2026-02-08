// NSFW content detection utility
// This utility analyzes text content and image descriptions to determine if content should be tagged as NSFW

interface NSFWDetectionResult {
  isNSFW: boolean
  confidence: number
  reasons: string[]
}

// NSFW keywords and patterns for text analysis - REFINED to focus on actual nudity/explicit content
const NSFW_KEYWORDS = [
  // Explicit sexual terms
  "sex",
  "sexual",
  "nude",
  "nudity", // Added nudity as specific keyword
  "naked",
  "porn",
  "pornographic",
  "erotic",
  "xxx",
  "nsfw",
  "explicit",
  "intimate",

  // Body parts (explicit contexts only)
  "breast",
  "boobs",
  "ass",
  "butt",
  "penis",
  "vagina",
  "genitals",
  "nipple",
  "nipples", // Added plural form

  // Adult activities
  "masturbation",
  "orgasm",
  "climax",
  "fetish",
  "bdsm",
  "kinky",
  "threesome",
  "orgy",
  "gangbang",
  "blowjob",
  "handjob",
  "anal",
  "oral sex", // Made more specific

  // Adult industry terms
  "escort",
  "prostitute",
  "stripper",
  "cam girl",
  "onlyfans",
  "premium content",
]

// High-confidence NSFW patterns (regex) - REFINED
const NSFW_PATTERNS = [
  /\b(fuck|fucking|fucked)\b/i,
  /\b(cum|cumming)\b/i,
  /\b(dick|cock|pussy)\b/i,
  /\b(18\+|21\+|adults?\s+only)\b/i,
  /\b(not\s+safe\s+for\s+work|nsfw)\b/i,
  /\b(explicit\s+content)\b/i,
]

// Context-aware phrases that are likely NSFW - REFINED to focus on nudity
const NSFW_PHRASES = [
  "barely legal",
  "topless",
  "bottomless",
  "fully nude",
  "completely naked",
  "strip tease",
  "lap dance",
  "adult entertainment",
  "viewer discretion",
  "explicit nudity",
  "sexual content",
  // "revealing outfit", "see-through", "parental advisory", "mature audience"
]

export function detectNSFWContent(
  text: string,
  imageDescription?: string,
  additionalContext?: string,
): NSFWDetectionResult {
  const fullText = [text, imageDescription, additionalContext].filter(Boolean).join(" ").toLowerCase()

  console.log(`[v0] NSFW Detection - Analyzing text: "${fullText}"`)

  const reasons: string[] = []
  let nsfwScore = 0

  // Check for explicit keywords
  for (const keyword of NSFW_KEYWORDS) {
    if (fullText.includes(keyword.toLowerCase())) {
      reasons.push(`Contains explicit keyword: "${keyword}"`)
      nsfwScore += 1
      console.log(`[v0] NSFW Detection - Found keyword: "${keyword}", score: ${nsfwScore}`)
    }
  }

  // Check for NSFW patterns
  for (const pattern of NSFW_PATTERNS) {
    if (pattern.test(fullText)) {
      reasons.push(`Matches explicit pattern: ${pattern.source}`)
      nsfwScore += 2 // Higher weight for patterns
      console.log(`[v0] NSFW Detection - Found pattern: ${pattern.source}, score: ${nsfwScore}`)
    }
  }

  // Check for NSFW phrases
  for (const phrase of NSFW_PHRASES) {
    if (fullText.includes(phrase)) {
      reasons.push(`Contains suggestive phrase: "${phrase}"`)
      nsfwScore += 1.5
      console.log(`[v0] NSFW Detection - Found phrase: "${phrase}", score: ${nsfwScore}`)
    }
  }

  // Additional heuristics
  if (fullText.includes("18+") || fullText.includes("21+")) {
    reasons.push("Contains age restriction indicators")
    nsfwScore += 2
    console.log(`[v0] NSFW Detection - Found age restriction, score: ${nsfwScore}`)
  }

  if (fullText.includes("onlyfans") || fullText.includes("premium")) {
    reasons.push("References adult content platforms")
    nsfwScore += 2
    console.log(`[v0] NSFW Detection - Found adult platform reference, score: ${nsfwScore}`)
  }

  // Calculate confidence based on score
  const confidence = Math.min(nsfwScore / 3, 1) // Normalize to 0-1 scale
  const isNSFW = nsfwScore >= 2 // Raised from 1 to 2 to require stronger indicators

  console.log(`[v0] NSFW Detection - Final result: isNSFW=${isNSFW}, score=${nsfwScore}, confidence=${confidence}`)
  console.log(`[v0] NSFW Detection - Reasons:`, reasons)

  return {
    isNSFW,
    confidence,
    reasons,
  }
}

// Specialized function for token content analysis
export function detectNSFWToken(
  name: string,
  ticker: string,
  description: string,
  imageDescription?: string,
): NSFWDetectionResult {
  // Combine all token metadata for analysis
  const combinedText = `${name} ${ticker} ${description}`

  return detectNSFWContent(combinedText, imageDescription, "token creation")
}

// Specialized function for gallery content analysis
export function detectNSFWGalleryItem(
  prompt: string,
  filename?: string,
  additionalMetadata?: string,
): NSFWDetectionResult {
  return detectNSFWContent(prompt, filename, additionalMetadata)
}

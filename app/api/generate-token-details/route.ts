import { callAIWithFallback } from "@/lib/chat-utils"

export async function POST(req: Request) {
  try {
    const { prompt, nsfwMode = false } = await req.json()

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        {
          error: "INVALID_PROMPT",
          message: "A valid prompt is required",
        },
        { status: 400 },
      )
    }

    const enhancedPrompt = nsfwMode
      ? `You are an expert cryptocurrency analyst and adult entertainment industry specialist. Analyze this user prompt with deep contextual understanding: "${prompt}"

CRITICAL ANALYSIS REQUIREMENTS:
1. Extract ALL specific keywords, themes, concepts, and intentions from the user's input
2. Identify the core value proposition or utility they're describing
3. Determine the target audience and use case they have in mind
4. Recognize any existing project references or inspirations they mention
5. Understand the emotional tone and branding direction they want

ADVANCED MATCHING STRATEGY:
- If they mention specific words/terms, those MUST appear in the name or symbol
- If they describe a problem/solution, make that the core utility
- If they reference existing projects, create something inspired but unique
- If they mention target users, tailor the description to that audience
- If they specify features/mechanics, incorporate those into the description
- Maintain adult/erotic themes while being true to their exact vision

SECTOR ALIGNMENT:
Consider these adult sectors based on their input: adult entertainment, dating/relationships, intimacy/wellness, pleasure products, fantasy/gaming, desire/attraction, adult content creation, intimate services, adult social platforms, erotic art/NFTs

Generate ONLY a JSON response with these exact fields:
{
  "name": "A token name that directly mirrors their input concept (2-4 words, use their exact keywords when possible)",
  "symbol": "A 3-5 character ticker derived from their specific terms (uppercase, abbreviate their key words)",
  "description": "A detailed description that shows you understood their exact vision (75-200 words, reference their original concept multiple times, explain how this token solves their specific problem or fulfills their exact need)"
}

ENHANCED EXAMPLES:
- User: "dating app for sugar daddies and babies" → Name: "Sugar Connect", Symbol: "SUGAR", Description: "Sugar Connect revolutionizes the sugar dating ecosystem by providing a decentralized platform where sugar daddies and sugar babies can connect safely..."
- User: "reward token for adult streamers tips" → Name: "Stream Rewards", Symbol: "TIPS", Description: "Stream Rewards empowers adult content creators with a dedicated tipping ecosystem. Viewers can tip their favorite streamers using TIPS tokens..."
- User: "NFT marketplace for erotic art collectors" → Name: "Erotic Art DAO", Symbol: "EART", Description: "Erotic Art DAO creates the premier marketplace for erotic NFT collectors and artists. The EART token governs this exclusive platform..."`
      : `You are an expert cryptocurrency analyst and blockchain technology specialist. Perform deep contextual analysis of this user prompt: "${prompt}"

CRITICAL ANALYSIS REQUIREMENTS:
1. Extract ALL specific keywords, themes, concepts, and intentions from the user's input
2. Identify the core value proposition, utility, or problem they're trying to solve
3. Determine the target market, industry, or use case they have in mind
4. Recognize any existing project references, inspirations, or competitive landscape mentions
5. Understand the technical requirements, features, or mechanisms they're describing
6. Assess the emotional tone, branding direction, and positioning they want

ADVANCED MATCHING STRATEGY:
- If they mention specific words/terms, those MUST appear prominently in the name or symbol
- If they describe a problem/solution, make that the central value proposition
- If they reference existing projects, create something inspired but differentiated
- If they mention target users/industries, tailor everything to that market
- If they specify features/mechanics/technology, incorporate those into the description
- If they indicate scale/ambition, reflect that in the positioning

SECTOR ALIGNMENT:
Consider these sectors based on their input: DeFi/Finance, Gaming/Metaverse, AI/ML, Social/Community, Infrastructure/Utility, Governance/DAO, NFTs/Digital Assets, Supply Chain/Logistics, Healthcare/Wellness, Education/Learning, Real Estate/Property, Energy/Sustainability, Identity/Privacy, Payments/Remittance, Insurance/Risk, Entertainment/Media

Generate ONLY a JSON response with these exact fields:
{
  "name": "A token name that directly mirrors their input concept (2-4 words, prioritize their exact keywords)",
  "symbol": "A 3-5 character ticker derived from their specific terms (uppercase, abbreviate their key words intelligently)",
  "description": "A comprehensive description proving you understood their exact vision (75-200 words, reference their original concept multiple times, explain the specific problem this solves, detail the target market, mention key features they described)"
}

ENHANCED EXAMPLES:
- User: "AI trading bot that helps retail investors beat the market" → Name: "AI Trade Assistant", Symbol: "AITA", Description: "AI Trade Assistant democratizes algorithmic trading for retail investors through advanced AI-powered market analysis. The AITA token provides access to sophisticated trading bots that help individual investors compete with institutional players..."
- User: "carbon credit marketplace for small businesses to offset emissions" → Name: "Carbon Credit Exchange", Symbol: "CCX", Description: "Carbon Credit Exchange creates the first marketplace designed specifically for small businesses to easily purchase and trade carbon credits. CCX tokens facilitate transparent, affordable carbon offsetting..."
- User: "gaming guild token for scholarship programs in play-to-earn games" → Name: "Guild Scholars", Symbol: "GUILD", Description: "Guild Scholars revolutionizes play-to-earn gaming by connecting skilled players with scholarship opportunities. GUILD tokens power a decentralized system where gaming guilds can sponsor players..."`

    try {
      const { response, provider } = await callAIWithFallback(
        [
          {
            role: "user",
            content: enhancedPrompt,
          },
        ],
        {
          maxTokens: 400,
          temperature: 0.7,
        },
      )

      console.log(`[v0] Token details generated using ${provider} provider`)

      if (!response.ok) {
        if (response.status === 429) {
          return Response.json(
            {
              error: "RATE_LIMITED",
              message: "AI service is currently busy. Please try again in a few moments.",
            },
            { status: 429 },
          )
        } else if (response.status === 401) {
          return Response.json(
            {
              error: "API_ERROR",
              message: "AI service authentication failed. Please try again later.",
            },
            { status: 500 },
          )
        } else if (response.status >= 500) {
          return Response.json(
            {
              error: "SERVICE_ERROR",
              message: "AI service is temporarily unavailable. Please try again later.",
            },
            { status: 503 },
          )
        } else {
          throw new Error(`AI API error: ${response.status}`)
        }
      }

      const data = await response.json()
      const text = data.choices?.[0]?.message?.content

      if (!text) {
        throw new Error("No response from AI API")
      }

      // Parse the JSON response
      let tokenDetails
      try {
        // Clean the response to extract JSON
        const cleanedText = text.trim()
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)

        if (jsonMatch) {
          tokenDetails = JSON.parse(jsonMatch[0])
        } else {
          tokenDetails = JSON.parse(cleanedText)
        }
      } catch (parseError) {
        console.error("[v0] Failed to parse AI response:", text)
        return Response.json(
          {
            error: "PARSE_ERROR",
            message: "Failed to parse AI response",
            details: text,
          },
          { status: 500 },
        )
      }

      // Validate the response structure
      if (!tokenDetails.name || !tokenDetails.symbol || !tokenDetails.description) {
        return Response.json(
          {
            error: "INVALID_RESPONSE",
            message: "AI response missing required fields",
            details: tokenDetails,
          },
          { status: 500 },
        )
      }

      return Response.json({
        success: true,
        tokenDetails: {
          name: tokenDetails.name,
          symbol: tokenDetails.symbol.toUpperCase(),
          description: tokenDetails.description,
        },
      })
    } catch (aiError) {
      console.error("[v0] AI generation failed with all providers:", aiError)
      return Response.json(
        {
          error: "AI_UNAVAILABLE",
          message: "All AI services are currently unavailable. Please try again later.",
        },
        { status: 503 },
      )
    }
  } catch (error) {
    console.error("[v0] Error generating token details:", error)
    return Response.json(
      {
        error: "INTERNAL_ERROR",
        message: "Internal server error occurred while generating token details",
      },
      { status: 500 },
    )
  }
}

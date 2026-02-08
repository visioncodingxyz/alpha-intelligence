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

    const PROMPTCHAN_API_KEY = process.env.PROMPTCHAN_API_KEY

    if (!PROMPTCHAN_API_KEY) {
      return Response.json(
        {
          error: "NO_API_KEY",
          message: "Promptchan API key is required. Please add PROMPTCHAN_API_KEY to your environment variables.",
        },
        { status: 400 },
      )
    }

    let enhancedPrompt: string
    let negativePrompt: string
    let promptchanPayload: any

    if (nsfwMode) {
      const conceptKeywords = prompt
        .toLowerCase()
        .split(" ")
        .filter((word) => word.length > 2)
      const primaryConcept = conceptKeywords.slice(0, 3).join(" ")

      const nsfwTemplates = [
        `seductive female character embodying the concept of ${primaryConcept}`,
        `beautiful model representing the theme of ${prompt}`,
        `sensual artistic interpretation of ${primaryConcept}`,
        `glamorous woman symbolizing ${prompt}`,
        `elegant model in a setting that reflects ${primaryConcept}`,
        `artistic nude photography inspired by ${prompt}`,
        `fashion model in an environment representing ${primaryConcept}`,
        `sensual portrait that captures the essence of ${prompt}`,
        `erotic art style interpretation of ${primaryConcept}`,
        `adult entertainment theme based on ${prompt}`,
      ]

      const contextualStyles = [
        `professional photography that visually represents ${primaryConcept}`,
        `artistic composition reflecting the ${prompt} concept`,
        `glamour photography with elements symbolizing ${primaryConcept}`,
        `boudoir style shoot inspired by ${prompt}`,
        `fashion photography incorporating ${primaryConcept} themes`,
        `artistic photography that embodies ${prompt}`,
        `sensual portrait style representing ${primaryConcept}`,
        `erotic art aesthetic inspired by ${prompt}`,
        `adult photography with ${primaryConcept} symbolism`,
        `intimate photography reflecting ${prompt} themes`,
      ]

      const randomNsfwTemplate = nsfwTemplates[Math.floor(Math.random() * nsfwTemplates.length)]
      const randomContextualStyle = contextualStyles[Math.floor(Math.random() * contextualStyles.length)]

      enhancedPrompt = `Create an adult-themed cryptocurrency token image featuring ${randomNsfwTemplate}, ${randomContextualStyle}, incorporating visual elements that directly relate to "${prompt}", high quality, detailed, professional photography, artistic, beautiful, attractive, seductive, glamorous, sensual, adult content, mature themes, symbolic representation of the user's specific concept`

      negativePrompt =
        "low quality, blurry, distorted, text, watermark, signature, child, minor, underage, ugly, deformed, bad anatomy, extra limbs, mutation, horror, gore, violence"

      promptchanPayload = {
        prompt: enhancedPrompt,
        negative_prompt: negativePrompt,
        style: "Hyperreal XL+",
        poses: "Default",
        filter: "Default",
        emotion: "Default",
        quality: "Ultra",
        image_size: "512x512",
        age_slider: 0,
        weight_slider: 0,
        breast_slider: 0,
        ass_slider: 0,
        seed: Math.floor(Math.random() * 1000000),
      }
    } else {
      const conceptKeywords = prompt
        .toLowerCase()
        .split(" ")
        .filter((word) => word.length > 2)
      const primaryConcept = conceptKeywords.slice(0, 3).join(" ")
      const secondaryConcepts = conceptKeywords.slice(3, 6).join(" ")

      const conceptualTemplates = [
        `abstract geometric design directly representing ${primaryConcept}`,
        `futuristic digital symbol embodying ${prompt}`,
        `cosmic space theme reflecting ${primaryConcept} concepts`,
        `cyberpunk aesthetic matching ${prompt}`,
        `nature-inspired organic shapes symbolizing ${primaryConcept}`,
        `architectural modern design representing ${prompt}`,
        `technological circuit patterns for ${primaryConcept}`,
        `artistic brush strokes expressing ${prompt}`,
        `crystalline structures symbolizing ${primaryConcept}`,
        `mechanical gears representing ${prompt} mechanics`,
        `flowing liquid metal design embodying ${primaryConcept}`,
        `holographic effects representing ${prompt}`,
        `tribal geometric patterns inspired by ${primaryConcept}`,
        `steampunk industrial design matching ${prompt}`,
        `bioluminescent organic forms symbolizing ${primaryConcept}`,
      ]

      const contextualStyles = [
        `professional branding that visually communicates ${primaryConcept}`,
        `luxury premium design reflecting ${prompt} values`,
        `modern tech aesthetic embodying ${primaryConcept}`,
        `gaming industry style representing ${prompt}`,
        `financial services branding inspired by ${primaryConcept}`,
        `creative agency design reflecting ${prompt}`,
        `blockchain technology theme matching ${primaryConcept}`,
        `AI and machine learning aesthetic for ${prompt}`,
        `social platform design embodying ${primaryConcept}`,
        `marketplace style representing ${prompt} ecosystem`,
      ]

      const randomConceptual = conceptualTemplates[Math.floor(Math.random() * conceptualTemplates.length)]
      const randomContextualStyle = contextualStyles[Math.floor(Math.random() * contextualStyles.length)]

      enhancedPrompt = `Create a professional cryptocurrency token logo featuring ${randomConceptual}, ${randomContextualStyle}, that visually represents the specific concept of "${prompt}" with symbolic elements directly related to ${primaryConcept}${secondaryConcepts ? ` and ${secondaryConcepts}` : ""}, digital art, high quality, detailed, cryptocurrency branding, innovative, futuristic, sleek design, vector art, clean composition, symbolic representation, brand identity, professional design, modern aesthetic`

      negativePrompt =
        "low quality, blurry, distorted, text, watermark, signature, child, minor, underage, human figure, person, face, body, anatomy, realistic human, portrait, character, people, crowd, nsfw, adult content, explicit, sexual, nude, naked, inappropriate, offensive"

      promptchanPayload = {
        prompt: enhancedPrompt,
        negative_prompt: negativePrompt,
        style: "Hyperreal XL+",
        poses: "Default",
        filter: "Professional",
        emotion: "Default",
        quality: "Ultra",
        image_size: "512x512",
        age_slider: 0,
        weight_slider: 0,
        breast_slider: 0,
        ass_slider: 0,
        seed: Math.floor(Math.random() * 1000000),
      }
    }

    try {
      const response = await fetch("https://prod.aicloudnetservices.com/api/external/create", {
        method: "POST",
        headers: {
          "x-api-key": PROMPTCHAN_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(promptchanPayload),
      })

      if (response.ok) {
        const data = await response.json()

        console.log("[v0] Promptchan API response for token image:", data)

        return Response.json({
          success: true,
          imageUrl: data.image,
          prompt: enhancedPrompt,
          model: "promptchan-ai",
          nsfwMode,
          parameters: {
            style: promptchanPayload.style,
            filter: promptchanPayload.filter,
            emotion: promptchanPayload.emotion,
            quality: promptchanPayload.quality,
            seed: promptchanPayload.seed,
          },
        })
      } else {
        const errorText = await response.text()
        console.log("[v0] Promptchan API error response:", errorText)

        return Response.json(
          {
            error: "API_ERROR",
            message: "Failed to generate image with Promptchan API",
            details: errorText,
          },
          { status: response.status },
        )
      }
    } catch (error) {
      console.error("[v0] Promptchan API error:", error)

      return Response.json(
        {
          error: "NETWORK_ERROR",
          message: "Network error while connecting to Promptchan API",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] Error generating token image:", error)
    return Response.json(
      {
        error: "INTERNAL_ERROR",
        message: "Internal server error occurred while generating token image",
      },
      { status: 500 },
    )
  }
}

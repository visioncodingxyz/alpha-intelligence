import { callAIWithFallback } from "@/lib/chat-utils"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const { response, provider } = await callAIWithFallback(
      [
        {
          role: "system",
          content: `You are a friendly and engaging AI assistant for an adult content creation platform. 
    Keep responses conversational, helpful, and appropriate for voice chat. 
    Respond naturally as if speaking to someone, avoiding overly formal language.
    Keep responses concise but informative, perfect for voice interaction.
    You can help with creative ideas, technical questions, and general conversation.`,
        },
        ...messages,
      ],
      {
        stream: true,
      },
    )

    console.log(`[v0] Voice chat response using ${provider} provider`)

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`)
    }

    // Create a streaming response compatible with AI SDK format
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader()
        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split("\n")

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6)
                if (data === "[DONE]") {
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    controller.enqueue(encoder.encode(`0:"${content.replace(/"/g, '\\"')}"\n`))
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        } catch (error) {
          controller.error(error)
        } finally {
          reader.releaseLock()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Vercel-AI-Data-Stream": "v1",
      },
    })
  } catch (error) {
    console.error("[v0] Voice chat API error:", error)
    return Response.json({ error: "Failed to process voice chat request" }, { status: 500 })
  }
}

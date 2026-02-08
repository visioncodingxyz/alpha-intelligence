export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface GroqResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface GroqStreamResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason: string | null
  }>
}

interface AIProvider {
  name: string
  baseUrl: string
  apiKey: string | undefined
  model: string
  headers: Record<string, string>
}

const AI_PROVIDERS: AIProvider[] = [
  {
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.3-70b-versatile",
    headers: {
      "Content-Type": "application/json",
    },
  },
  {
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    apiKey: process.env.OPENROUTER_API_KEY,
    model: "meta-llama/llama-3.1-70b-instruct",
    headers: {
      "Content-Type": "application/json",
      "HTTP-Referer": "https://skal-ventures.vercel.app",
      "X-Title": "Skal Ventures",
    },
  },
]

export async function callAIWithFallback(
  messages: ChatMessage[],
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
    stream?: boolean
  } = {},
): Promise<{ response: Response; provider: string }> {
  const { temperature = 0.7, maxTokens = 512, stream = false } = options

  // Filter providers that have API keys configured
  const availableProviders = AI_PROVIDERS.filter((provider) => provider.apiKey)

  if (availableProviders.length === 0) {
    throw new Error("No AI providers configured with valid API keys")
  }

  let lastError: Error | null = null

  // Try each provider in order
  for (const provider of availableProviders) {
    try {
      console.log(`[v0] Trying ${provider.name} provider...`)

      const makeRequest = async (retryCount = 0): Promise<Response> => {
        const response = await fetch(provider.baseUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            ...provider.headers,
          },
          body: JSON.stringify({
            model: provider.model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream,
          }),
        })

        // Handle rate limiting with exponential backoff (only for primary provider)
        if (response.status === 429 && retryCount < 2 && provider.name === "Groq") {
          const delay = Math.pow(2, retryCount) * 1000 + Math.random() * 500
          console.log(`[v0] ${provider.name} rate limited, retrying in ${delay}ms (attempt ${retryCount + 1}/2)`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          return makeRequest(retryCount + 1)
        }

        return response
      }

      const response = await makeRequest()

      if (response.ok) {
        console.log(`[v0] Successfully using ${provider.name} provider`)
        return { response, provider: provider.name }
      }

      // Log the error but continue to next provider
      console.log(`[v0] ${provider.name} failed with status ${response.status}, trying next provider...`)
      lastError = new Error(`${provider.name} API error: ${response.status}`)
    } catch (error) {
      console.log(`[v0] ${provider.name} request failed:`, error)
      lastError = error instanceof Error ? error : new Error(`${provider.name} request failed`)
    }
  }

  // If all providers failed, throw the last error
  throw lastError || new Error("All AI providers failed")
}

export async function callGroqAPI(
  messages: ChatMessage[],
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
    stream?: boolean
  } = {},
): Promise<Response> {
  const result = await callAIWithFallback(messages, options)
  return result.response
}

export function createStreamingResponse(groqResponse: Response): Response {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const stream = new ReadableStream({
    async start(controller) {
      const reader = groqResponse.body?.getReader()
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
                const parsed: GroqStreamResponse = JSON.parse(data)
                const content = parsed.choices?.[0]?.delta?.content
                if (content) {
                  // Format as UI message stream compatible with @ai-sdk/react
                  const uiMessage = {
                    id: parsed.id || Date.now().toString(),
                    role: "assistant",
                    content,
                  }
                  controller.enqueue(encoder.encode(`0:${JSON.stringify(uiMessage)}\n`))
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
}

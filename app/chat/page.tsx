"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, User, Trash2, MessageSquare, Sparkles, Home, Mic, Loader2 } from "lucide-react"
import Link from "next/link"
import { VoiceProvider, useVoice } from "@humeai/voice-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

function VoiceChat({
  accessToken,
  onClose,
  configId,
}: { accessToken: string; onClose: () => void; configId?: string }) {
  const { connect, disconnect, status, messages: voiceMessages } = useVoice()
  const voiceMessagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollToBottom = () => {
      if (voiceMessagesEndRef.current) {
        voiceMessagesEndRef.current.scrollIntoView({ behavior: "smooth" })
      }
    }

    if (voiceMessages.length > 0) {
      const timeoutId = setTimeout(scrollToBottom, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [voiceMessages])

  const handleConnect = () => {
    const finalConfigId = configId || process.env.NEXT_PUBLIC_HUME_CONFIG_ID_STANDARD

    connect({
      auth: { type: "accessToken", value: accessToken },
      ...(finalConfigId && { configId: finalConfigId }),
    })
      .then(() => {
        console.log("[v0] Voice connection established with config:", finalConfigId)
      })
      .catch((error) => {
        console.error("[v0] Voice connection failed:", error)
      })
  }

  const handleDisconnect = () => {
    disconnect()
    onClose()
    console.log("[v0] Voice connection ended")
  }

  if (status.value === "connected") {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div
          className="bg-background border border-border p-8 max-w-md w-full mx-4"
          style={{
            clipPath:
              "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
          }}
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mic className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-lg font-mono uppercase mb-2">Voice Chat Active</h3>
            <p className="text-sm text-foreground/60 font-mono">Speak naturally to chat with AI</p>
          </div>

          {/* Voice Messages Display */}
          <div className="max-h-40 overflow-y-auto mb-6 space-y-0">
            {voiceMessages.map((message, index) => (
              <div
                key={index}
                className={`text-xs font-mono p-2 rounded ${
                  message.type === "user_message" ? "bg-primary/10 text-right" : "bg-background/50"
                }`}
              >
                {message.message?.content && (
                  <>
                    <span className="uppercase text-foreground/80">
                      {message.type === "user_message" ? "You: " : "AI: "}
                    </span>
                    {message.message.content}
                  </>
                )}
              </div>
            ))}
            <div ref={voiceMessagesEndRef} />
          </div>

          <Button onClick={handleDisconnect} className="w-full font-mono uppercase" variant="destructive">
            End Voice Chat
          </Button>
        </div>
      </div>
    )
  }

  if (status.value === "connecting") {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div
          className="bg-background border border-border p-8 max-w-md w-full mx-4"
          style={{
            clipPath:
              "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
          }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
              <div
                className="absolute inset-2 rounded-full border-2 border-primary/20 border-r-primary animate-spin"
                style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
              ></div>
              <Loader2 className="w-6 h-6 text-primary animate-spin" style={{ animationDuration: "2s" }} />
            </div>
            <h3 className="text-lg font-mono uppercase mb-2">Connecting...</h3>
            <p className="text-sm text-foreground/60 font-mono">Starting voice chat</p>
          </div>
        </div>
      </div>
    )
  }

  // Show start call interface
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div
        className="bg-background border border-border p-8 max-w-md w-full mx-4"
        style={{
          clipPath:
            "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
        }}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mic className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-mono uppercase mb-2">Voice Chat Ready</h3>
          <p className="text-sm text-foreground/60 font-mono">Click to start voice conversation</p>
        </div>

        <div className="space-y-3">
          <Button onClick={handleConnect} className="w-full font-mono uppercase">
            Start Voice Chat
          </Button>
          <Button onClick={onClose} className="w-full font-mono uppercase bg-transparent" variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false)
  const [selectedVoiceMode, setSelectedVoiceMode] = useState<string | null>(null) // Start with null
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null)
  const [enableNSFW, setEnableNSFW] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const voiceDropdownRef = useRef<HTMLDivElement>(null)
  const nsfwModeRef = useRef(false)
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    nsfwModeRef.current = enableNSFW
    console.log("[v0] NSFW mode updated:", enableNSFW)
  }, [enableNSFW])

  useEffect(() => {
    const fetchHumeToken = async () => {
      try {
        const response = await fetch("/api/hume-token")
        const data = await response.json()
        setAccessToken(data.accessToken)
        console.log("[v0] Hume AI access token fetched")
      } catch (error) {
        console.error("[v0] Failed to fetch Hume AI token:", error)
      }
    }

    fetchHumeToken()
  }, [])

  useEffect(() => {
    const savedSessions = localStorage.getItem("chatSessions")
    if (savedSessions) {
      const sessions = JSON.parse(savedSessions).map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
      }))
      setChatSessions(sessions)
    }
  }, [])

  useEffect(() => {
    const scrollToBottom = () => {
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
        if (viewport) {
          viewport.scrollTo({
            top: viewport.scrollHeight,
            behavior: "smooth",
          })
        }
      }
    }

    if (messages.length > 0) {
      const timeoutId = setTimeout(scrollToBottom, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [messages])

  const saveChatSession = () => {
    if (messages.length === 0) return

    const firstMessageContent = messages[0]?.content || ""
    const sessionTitle =
      firstMessageContent.length > 0
        ? firstMessageContent.slice(0, 50) + (firstMessageContent.length > 50 ? "..." : "")
        : "New Chat"
    const now = new Date()

    if (currentSessionId) {
      setChatSessions((prev) => {
        const updated = prev.map((session) =>
          session.id === currentSessionId ? { ...session, messages, updatedAt: now, title: sessionTitle } : session,
        )
        localStorage.setItem("chatSessions", JSON.stringify(updated))
        return updated
      })
    } else {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: sessionTitle,
        messages,
        createdAt: now,
        updatedAt: now,
      }
      setChatSessions((prev) => {
        const updated = [newSession, ...prev]
        localStorage.setItem("chatSessions", JSON.stringify(updated))
        return updated
      })
      setCurrentSessionId(newSession.id)
    }
  }

  const loadChatSession = (session: ChatSession) => {
    setMessages(session.messages)
    setCurrentSessionId(session.id)
  }

  const startNewChat = () => {
    setMessages([])
    setCurrentSessionId(null)
  }

  const deleteChatSession = (sessionId: string) => {
    setChatSessions((prev) => {
      const updated = prev.filter((session) => session.id !== sessionId)
      localStorage.setItem("chatSessions", JSON.stringify(updated))
      return updated
    })

    if (currentSessionId === sessionId) {
      startNewChat()
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input || !input.trim()) return

    console.log("[v0] Sending message:", input, "NSFW mode:", nsfwModeRef.current)
    setIsLoading(true)

    const userMessage: Message = { role: "user", content: input }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages,
          nsfwMode: nsfwModeRef.current,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ""

      setMessages((prev) => [...prev, { role: "assistant", content: "" }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") continue

              try {
                const parsed = JSON.parse(data)
                if (parsed.choices?.[0]?.delta?.content) {
                  assistantMessage += parsed.choices[0].delta.content
                  setMessages((prev) => {
                    const newMessages = [...prev]
                    newMessages[newMessages.length - 1] = {
                      role: "assistant",
                      content: assistantMessage,
                    }
                    return newMessages
                  })
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      setIsLoading(false)
      setTimeout(() => saveChatSession(), 100)
    } catch (error) {
      console.error("[v0] Chat error:", error)
      setIsLoading(false)
      setMessages((prev) => prev.slice(0, -1))
    }
  }

  useEffect(() => {
    console.log("[v0] Messages updated:", messages.length, messages)
  }, [messages])

  useEffect(() => {
    console.log("[v0] Chat status:", "Not using useChat hook")
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  const voiceModeOptions = ["Standard ✅"]

  const handleVoiceModeSelect = (option: string) => {
    setSelectedVoiceMode(option)
    setIsVoiceDropdownOpen(false)

    let configId = process.env.NEXT_PUBLIC_HUME_CONFIG_ID_STANDARD

    if (option === "NSFW 🔞") {
      configId = process.env.NEXT_PUBLIC_HUME_CONFIG_ID_NSFW
    }

    setSelectedConfigId(configId)

    if (accessToken) {
      console.log(`[v0] Starting voice chat with ${option} mode using config:`, configId)
    }
  }

  const closeVoiceChat = () => {
    setSelectedVoiceMode(null)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (voiceDropdownRef.current && !voiceDropdownRef.current.contains(event.target as Node)) {
        setIsVoiceDropdownOpen(false)
      }
    }

    if (isVoiceDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isVoiceDropdownOpen])

  return (
    <VoiceProvider
      auth={{ type: "accessToken", value: accessToken || "" }}
      configId={process.env.NEXT_PUBLIC_HUME_CONFIG_ID_STANDARD}
    >
      <div className="h-screen bg-background text-foreground flex flex-col md:flex-row overflow-hidden">
        <div className="hidden md:flex w-80 border-r border-border bg-background/50 backdrop-blur-sm p-6 flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-mono uppercase tracking-wide flex items-center gap-2">CHAT HISTORY</h2>
            <Button onClick={startNewChat} size="sm" className="font-mono uppercase text-xs">
              <Sparkles className="w-4 h-4 mr-2" />
              NEW CHAT
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-3">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 cursor-pointer transition-all duration-300 border border-border/50 bg-background/30 backdrop-blur-sm hover:border-primary/50 hover:bg-primary/5 ${
                    currentSessionId === session.id ? "border-primary bg-primary/10" : ""
                  }`}
                  style={{
                    clipPath:
                      "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
                  }}
                  onClick={() => loadChatSession(session)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-mono text-sm truncate text-foreground">{session.title}</h3>
                      <p className="text-xs text-foreground/60 mt-1 font-mono">{session.messages.length} MESSAGES</p>
                      <p className="text-xs text-foreground/40 font-mono">{session.updatedAt.toLocaleDateString()}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteChatSession(session.id)
                      }}
                      className="h-6 w-6 p-0 text-foreground/40 hover:text-primary transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {chatSessions.length === 0 && (
                <div className="text-center py-12 text-foreground/60">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm font-mono uppercase tracking-wide">NO CHAT HISTORY</p>
                  <p className="text-xs font-mono mt-1">START A CONVERSATION</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 border-b border-border/30 flex-shrink-0 gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative" ref={voiceDropdownRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-mono uppercase text-xs border-none outline-none focus:outline-none"
                  onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Voice Mode
                </Button>

                {isVoiceDropdownOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 bg-background border border-border/50 backdrop-blur-sm z-50 min-w-[140px]"
                    style={{
                      clipPath:
                        "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 8px), 0 4px)",
                    }}
                  >
                    {voiceModeOptions.map((option) => (
                      <button
                        key={option}
                        className="w-full text-left px-3 py-2 text-xs font-mono uppercase hover:bg-primary/10 transition-colors"
                        onClick={() => handleVoiceModeSelect(option)}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Remove NSFW checkbox */}
            </div>

            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="font-mono uppercase text-xs border-none outline-none focus:outline-none"
              >
                <Home className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">BACK TO HOME</span>
                <span className="sm:hidden">HOME</span>
              </Button>
            </Link>
          </div>

          <ScrollArea className="flex-1 p-3 sm:p-6 min-h-0" ref={scrollAreaRef}>
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                  <img
                    src={enableNSFW ? "/images/bot-avatar.png" : "/images/alpha-logo.png"}
                    alt="AI Logo"
                    className="w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 rounded-full"
                  />
                  <h3 className="text-xl sm:text-2xl font-sentient mb-3 sm:mb-4">Alpha Chatbot 🤖</h3>
                  <p className="text-foreground/60 mb-6 sm:mb-8 font-mono text-sm max-w-md">UNLEASH YOUR CREATIVITY</p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 sm:gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-3 sm:gap-4 max-w-[85%] sm:max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border ${
                          message.role === "user"
                            ? "bg-primary text-background border-primary"
                            : "bg-background border-border text-foreground"
                        }`}
                        style={{
                          clipPath:
                            "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 8px), 0 4px)",
                        }}
                      >
                        {message.role === "user" ? (
                          <User className="w-3 h-3 sm:w-4 sm:h-4" />
                        ) : (
                          <img
                            src={enableNSFW ? "/images/bot-avatar.png" : "/images/alpha-logo.png"}
                            alt="Bot"
                            className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                          />
                        )}
                      </div>
                    </div>
                    <div
                      className={`p-3 sm:p-4 border ${
                        message.role === "user"
                          ? "bg-primary/10 border-primary/30 text-foreground"
                          : "bg-background/50 border-border/50 text-foreground"
                      } backdrop-blur-sm`}
                      style={{
                        clipPath:
                          "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
                      }}
                    >
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p className="whitespace-pre-wrap m-0 font-mono text-xs sm:text-sm leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="h-px bg-border/50 flex-shrink-0" />

          <div className="p-3 sm:p-6 bg-background/95 backdrop-blur-sm border-t border-border/30 flex-shrink-0">
            <form onSubmit={onSubmit} className="max-w-4xl mx-auto">
              <div className="flex gap-2 sm:gap-3 items-stretch">
                <div className="flex-1 relative">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="TYPE YOUR MESSAGE HERE..."
                    disabled={isLoading}
                    className="bg-background/50 border-border/50 text-foreground placeholder:text-foreground/40 font-mono text-sm h-10 sm:h-12 backdrop-blur-sm focus:border-primary/50 focus:ring-primary/20"
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !input || !input.trim()}
                  size="xs"
                  className="h-10 sm:h-12 px-4 sm:px-6 font-mono uppercase text-xs sm:text-sm flex-shrink-0"
                >
                  <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">SEND</span>
                </Button>
              </div>
              <p className="text-xs text-foreground/40 mt-2 sm:mt-3 text-center font-mono uppercase tracking-wide">
                PRESS ENTER TO SEND • POWERED BY $AI
              </p>
            </form>
          </div>
        </div>

        {accessToken && selectedVoiceMode && (
          <VoiceChat accessToken={accessToken} onClose={closeVoiceChat} configId={selectedConfigId || undefined} />
        )}
      </div>
    </VoiceProvider>
  )
}

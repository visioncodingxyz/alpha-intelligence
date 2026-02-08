"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react"
import { useChat } from "@ai-sdk/react"

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}

export default function VoiceChat() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/voice-chat",
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true

        recognitionRef.current.onresult = (event) => {
          let finalTranscript = ""
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript
            }
          }
          if (finalTranscript) {
            setTranscript(finalTranscript)
            // Auto-submit when speech ends
            setTimeout(() => {
              if (finalTranscript.trim()) {
                handleInputChange({ target: { value: finalTranscript } } as any)
                handleSubmit({ preventDefault: () => {} } as any)
                setTranscript("")
              }
            }, 1000)
          }
        }

        recognitionRef.current.onerror = (event) => {
          console.error("Speech recognition error:", event.error)
          setIsListening(false)
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }

      // Initialize speech synthesis
      synthRef.current = window.speechSynthesis
    }
  }, [handleInputChange, handleSubmit])

  // Speak the latest AI response
  useEffect(() => {
    const lastMessage = messages[messages.length - 1]
    if (lastMessage && lastMessage.role === "assistant" && synthRef.current) {
      const utterance = new SpeechSynthesisUtterance(lastMessage.content)
      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)

      // Use a more natural voice if available
      const voices = synthRef.current.getVoices()
      const preferredVoice = voices.find(
        (voice) => voice.name.includes("Female") || voice.name.includes("Samantha") || voice.name.includes("Karen"),
      )
      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.rate = 0.9
      utterance.pitch = 1.1

      synthRef.current.speak(utterance)
    }
  }, [messages])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition not supported in this browser")
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const toggleSpeaking = () => {
    if (!synthRef.current) return

    if (isSpeaking) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">AI Voice Chat 🔥</h1>
          <p className="text-muted-foreground">Have a natural conversation with AI using your voice</p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex justify-center gap-4 mb-6">
            <Button
              onClick={toggleListening}
              variant={isListening ? "destructive" : "default"}
              size="lg"
              className="flex items-center gap-2"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              {isListening ? "Stop Listening" : "Start Listening"}
            </Button>

            <Button
              onClick={toggleSpeaking}
              variant={isSpeaking ? "destructive" : "outline"}
              size="lg"
              className="flex items-center gap-2"
            >
              {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              {isSpeaking ? "Stop Speaking" : "AI Speaking"}
            </Button>
          </div>

          {transcript && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">You're saying:</p>
              <p className="font-medium">{transcript}</p>
            </div>
          )}

          {isLoading && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span>AI is thinking...</span>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {messages.map((message, index) => (
            <Card
              key={index}
              className={`p-4 ${
                message.role === "user" ? "ml-12 bg-primary text-primary-foreground" : "mr-12 bg-muted"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="font-semibold text-sm">{message.role === "user" ? "You" : "AI"}</div>
                <div className="flex-1">
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { GL } from "./gl"
import { Pill } from "./pill"
import { Button } from "./ui/button"
import { useState, useEffect } from "react"
import Image from "next/image"

export function Hero() {
  const [hovering, setHovering] = useState(false)
  const [currentContent, setCurrentContent] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const content = [
    {
      heading: (
        <>
          Create stunning <br />
          <i className="font-bold">AI</i> content
        </>
      ),
      description: "Advanced AI-powered image generation for creators, artists, and innovators",
    },
    {
      heading: (
        <>
          Unleash your <br />
          <b>
            <i>creative</i>
          </b>{" "}
          potential
        </>
      ),
      description: "Chat with our intelligent, versatile AI assistant for unlimited creative possibilities.",
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      // Start fade out
      setIsVisible(false)

      // After fade out completes, switch content and fade in
      setTimeout(() => {
        setCurrentContent((prev) => (prev + 1) % content.length)
        setIsVisible(true)
      }, 500) // Half second for fade out
    }, 8000) // Increased from 4000ms to 8000ms (8 seconds) to make headings last longer

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] sm:min-h-[calc(100vh-160px)] justify-center items-center relative mt-12 sm:mt-16 px-4 sm:px-6">
      <GL hovering={hovering} />

      <div className="text-center relative z-10 w-full max-w-4xl">
        <Pill className="mb-4 sm:mb-6">
          <Image src="/images/solana-logo.png" alt="Solana Logo" width={16} height={16} className="inline-block mr-2" />
          Built on Solana
        </Pill>
        <div className={`transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-sentient leading-tight">
            {content[currentContent].heading}
          </h1>
          <p className="font-mono text-xs sm:text-sm md:text-base text-foreground/60 text-balance mt-4 sm:mt-6 md:mt-8 max-w-[90%] sm:max-w-[600px] mx-auto px-2 sm:px-0">
            {content[currentContent].description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-8 sm:mt-12 md:mt-14 w-full max-w-md sm:max-w-none mx-auto">
          <Link href="/create" className="w-full sm:w-auto">
            <Button
              className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4"
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              [GENERATE IMAGE]
            </Button>
          </Link>
          <Link href="/chat" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 bg-transparent"
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              [CHAT WITH AI]
            </Button>
          </Link>
        </div>

        <div className="mt-6 sm:mt-8">
          <Link
            href="/mint-nft"
            className="inline-flex items-center gap-2 text-sm sm:text-base font-mono text-foreground/80 hover:text-primary transition-colors group"
          >
            <span className="px-2 py-0.5 text-xs font-bold bg-transparent border border-primary text-primary rounded">
              NEW
            </span>
            <span className="group-hover:underline">Mint an NFT</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

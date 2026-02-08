"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Home, FileText, Rocket, Menu, X } from 'lucide-react'
import Link from "next/link"
import { useRouter } from 'next/navigation'

const sections = [
  { id: "tokenomics", title: "Tokenomics", icon: FileText },
  { id: "roadmap", title: "Roadmap", icon: Rocket },
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("tokenomics")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "")
      if (hash && sections.some((s) => s.id === hash)) {
        setActiveSection(hash)
        scrollToSection(hash, false) // Don't update URL again
      }
    }

    // Set initial section from URL hash
    const initialHash = window.location.hash.replace("#", "")
    if (initialHash && sections.some((s) => s.id === initialHash)) {
      setActiveSection(initialHash)
      setTimeout(() => scrollToSection(initialHash, false), 100)
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  useEffect(() => {
    const observerOptions = {
      root: document.querySelector("[data-radix-scroll-area-viewport]"),
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0.1,
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id
          setActiveSection(sectionId)
          // Update URL hash without triggering navigation
          if (window.location.hash !== `#${sectionId}`) {
            window.history.replaceState(null, "", `#${sectionId}`)
          }
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    // Observe all sections
    sections.forEach((section) => {
      const element = document.getElementById(section.id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [])

  const scrollToSection = (sectionId: string, updateUrl = true) => {
    const element = document.getElementById(sectionId)
    const scrollContainer = document.querySelector("[data-radix-scroll-area-viewport]")

    if (element && scrollContainer) {
      const elementTop = element.offsetTop - 150
      scrollContainer.scrollTo({
        top: elementTop,
        behavior: "smooth",
      })

      if (updateUrl) {
        window.history.pushState(null, "", `#${sectionId}`)
      }
      setActiveSection(sectionId)
      setIsMobileMenuOpen(false) // Close mobile menu after navigation
    }
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col lg:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-3 sm:p-4 border-b border-border/30 bg-background/95 backdrop-blur-sm">
        <h2 className="text-base sm:text-lg font-mono uppercase tracking-wide flex items-center gap-2 text-yellow-500">
          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          DOCUMENTATION
        </h2>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-foreground hover:text-primary transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-background border-r border-border w-80 max-w-[80vw] h-full flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border/30">
              <h2 className="text-lg font-mono uppercase tracking-wide flex items-center gap-2 text-yellow-500">
                <FileText className="w-5 h-5" />
                DOCUMENTATION
              </h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-foreground hover:text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon
                    return (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        onClick={(e) => {
                          e.preventDefault()
                          scrollToSection(section.id)
                        }}
                        className={`w-full flex items-center gap-3 p-3 text-left font-mono uppercase text-sm tracking-wide transition-colors ${
                          activeSection === section.id
                            ? "bg-primary/20 text-primary border-l-2 border-primary"
                            : "text-foreground/70 hover:text-foreground hover:bg-accent/50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {section.title}
                      </a>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>

            <div className="p-4 bg-background/95 backdrop-blur-sm border-t border-border/30">
              <Link href="/">
                <Button className="w-full font-mono uppercase text-sm h-12">
                  <Home className="w-4 h-4 mr-2" />
                  BACK TO HOME
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navigation Panel - Left Side */}
      <div className="hidden lg:flex w-80 border-r border-border bg-background/50 backdrop-blur-sm flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b border-border/30 flex-shrink-0 h-[73px]">
          <h2 className="text-lg font-mono uppercase tracking-wide flex items-center gap-2 text-yellow-500">
            <FileText className="w-5 h-5" />
            DOCUMENTATION
          </h2>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection(section.id)
                    }}
                    className={`w-full flex items-center gap-3 p-3 text-left font-mono uppercase text-sm tracking-wide transition-colors ${
                      activeSection === section.id
                        ? "bg-primary/20 text-primary border-l-2 border-primary"
                        : "text-foreground/70 hover:text-foreground hover:bg-accent/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {section.title}
                  </a>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Back to Home Button - Fixed at bottom */}
        <div className="p-4 bg-background/95 backdrop-blur-sm border-t border-border/30 flex-shrink-0">
          <Link href="/">
            <Button className="w-full font-mono uppercase text-sm h-12">
              <Home className="w-4 h-4 mr-2" />
              BACK TO HOME
            </Button>
          </Link>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col h-full">
        <div className="hidden lg:flex justify-between items-center p-4 border-b border-border/30 flex-shrink-0 h-[73px]">
          <h3 className="text-lg font-mono uppercase tracking-wide">$AI DOCS</h3>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 sm:p-6 space-y-12 sm:space-y-16">
              {/* Tokenomics Section */}
              <section id="tokenomics" className="scroll-mt-24">
                <h2 className="text-2xl sm:text-3xl font-mono uppercase mb-6 sm:mb-8 text-primary tracking-wide">
                  TOKENOMICS
                </h2>

                <div
                  className="bg-background/50 border border-border/50 backdrop-blur-sm p-4 sm:p-8"
                  style={{
                    clipPath:
                      "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
                  }}
                >
                  <div className="grid gap-6 sm:gap-8">
                    <div>
                      <h3 className="text-lg sm:text-xl font-mono mb-3 sm:mb-4 text-primary uppercase tracking-wide">
                        TOTAL SUPPLY
                      </h3>
                      <p className="text-base sm:text-lg font-mono">1,000,000,000 $AI (1B TOTAL SUPPLY)</p>
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-mono mb-3 sm:mb-4 text-primary uppercase tracking-wide">
                        TRANSACTION TAX: 10%
                      </h3>
                      <div className="space-y-3 sm:space-y-4">
                        <div
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 bg-background/30 border border-border/30 gap-2 sm:gap-0"
                          style={{
                            clipPath:
                              "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 8px), 0 4px)",
                          }}
                        >
                          <span className="font-mono uppercase text-xs sm:text-sm">
                            holder REWARDS (SOL airdropped every 60 minutes)
                          </span>
                          <span className="font-mono text-primary text-base sm:text-lg">5%</span>
                        </div>

                        <div
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 bg-background/30 border border-border/30 gap-2 sm:gap-0"
                          style={{
                            clipPath:
                              "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 8px), 0 4px)",
                          }}
                        >
                          <span className="font-mono uppercase text-xs sm:text-sm">MARKETING & DEVELOPMENT</span>
                          <span className="font-mono text-primary text-base sm:text-lg">4%</span>
                        </div>

                        <div
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 bg-background/30 border border-border/30 gap-2 sm:gap-0"
                          style={{
                            clipPath:
                              "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 8px), 0 4px)",
                          }}
                        >
                          <span className="font-mono uppercase text-xs sm:text-sm">BUY BACKS & BURNS OF $AI</span>
                          <span className="font-mono text-primary text-base sm:text-lg">1%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Roadmap Section */}
              <section id="roadmap" className="scroll-mt-24">
                <h2 className="text-2xl sm:text-3xl font-mono uppercase mb-6 sm:mb-8 text-primary tracking-wide">
                  ROADMAP
                </h2>

                <div className="space-y-6 sm:space-y-8">
                  {/* Phase 1 */}
                  <div
                    className="bg-background/50 border border-border/50 backdrop-blur-sm p-4 sm:p-8"
                    style={{
                      clipPath:
                        "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
                    }}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <span className="text-xl sm:text-2xl">🚀</span>
                      <h3 className="text-xl sm:text-2xl font-mono uppercase text-primary tracking-wide">
                        PHASE 1: LAUNCH
                      </h3>
                      <span
                        className="px-2 sm:px-3 py-1 bg-yellow-500/20 text-yellow-400 font-mono text-xs uppercase tracking-wide"
                        style={{
                          clipPath:
                            "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 8px), 0 4px)",
                        }}
                      >
                        IN PROGRESS
                      </span>
                    </div>
                    <ul className="space-y-2 sm:space-y-3 text-foreground/90">
                      <li className="flex items-start gap-2 sm:gap-3">
                        <span className="text-primary mt-1 font-mono">•</span>
                        <span className="font-mono text-xs sm:text-sm">LAUNCH TOKEN ON RAYDIUM</span>
                      </li>
                      <li className="flex items-start gap-2 sm:gap-3">
                        <span className="text-primary mt-1 font-mono">•</span>
                        <span className="font-mono text-xs sm:text-sm">BUILD A STRONG COMMUNITY ON TELEGRAM AND X</span>
                      </li>
                      <li className="flex items-start gap-2 sm:gap-3">
                        <span className="text-primary mt-1 font-mono">•</span>
                        <span className="font-mono text-xs sm:text-sm">
                          RELEASE A BETA VERSION OF OUR ALPHA AI SUITE
                        </span>
                      </li>
                      <li className="flex items-start gap-2 sm:gap-3">
                        <span className="text-primary mt-1 font-mono">•</span>
                        <span className="font-mono text-xs sm:text-sm">GET LISTED ON COINGECKO</span>
                      </li>
                    </ul>
                  </div>

                  {/* Phase 2 */}
                  <div
                    className="bg-background/50 border border-border/50 backdrop-blur-sm p-4 sm:p-8"
                    style={{
                      clipPath:
                        "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
                    }}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <span className="text-xl sm:text-2xl">📈</span>
                      <h3 className="text-xl sm:text-2xl font-mono uppercase text-primary tracking-wide">
                        PHASE 2: GROWTH
                      </h3>
                      <span
                        className="px-2 sm:px-3 py-1 bg-blue-500/20 text-blue-400 font-mono text-xs uppercase tracking-wide"
                        style={{
                          clipPath:
                            "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 8px), 0 4px)",
                        }}
                      >
                        COMING SOON
                      </span>
                    </div>
                    <ul className="space-y-2 sm:space-y-3 text-foreground/90">
                      <li className="flex items-start gap-2 sm:gap-3">
                        <span className="text-primary mt-1 font-mono">•</span>
                        <span className="font-mono text-xs sm:text-sm">GET GOLD CHECK VERIFIED ON X/TWITTER</span>
                      </li>
                      <li className="flex items-start gap-2 sm:gap-3">
                        <span className="text-primary mt-1 font-mono">•</span>
                        <span className="font-mono text-xs sm:text-sm">LIST ON COINMARKETCAP</span>
                      </li>
                      <li className="flex items-start gap-2 sm:gap-3">
                        <span className="text-primary mt-1 font-mono">•</span>
                        <span className="font-mono text-xs sm:text-sm">
                          RELEASE THE OFFICIAL COMMUNITY VOTING SYSTEM ($AI DAO)
                        </span>
                      </li>
                      <li className="flex items-start gap-2 sm:gap-3">
                        <span className="text-primary mt-1 font-mono">•</span>
                        <span className="font-mono text-xs sm:text-sm">
                          RELEASE THE FULL-FEATURED VERSION OF OUR ALPHA AI SUITE
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* Phase 3 */}
                  <div
                    className="bg-background/50 border border-border/50 backdrop-blur-sm p-4 sm:p-8"
                    style={{
                      clipPath:
                        "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
                    }}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <span className="text-xl sm:text-2xl">🌟</span>
                      <h3 className="text-xl sm:text-2xl font-mono uppercase text-primary tracking-wide">
                        PHASE 3: BIG TIME
                      </h3>
                      <span
                        className="px-2 sm:px-3 py-1 bg-purple-500/20 text-purple-400 font-mono text-xs uppercase tracking-wide"
                        style={{
                          clipPath:
                            "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 8px), 0 4px)",
                        }}
                      >
                        FUTURE
                      </span>
                    </div>
                    <ul className="space-y-2 sm:space-y-3 text-foreground/90">
                      <li className="flex items-start gap-2 sm:gap-3">
                        <span className="text-primary mt-1 font-mono">•</span>
                        <span className="font-mono text-xs sm:text-sm">
                          LIST ON MAJOR CENTRALIZED EXCHANGES (BINANCE, COINBASE)
                        </span>
                      </li>
                      <li className="flex items-start gap-2 sm:gap-3">
                        <span className="text-primary mt-1 font-mono">•</span>
                        <span className="font-mono text-xs sm:text-sm">LAUNCH A MOBILE APP FOR OUR AI TOOLS</span>
                      </li>
                      <li className="flex items-start gap-2 sm:gap-3">
                        <span className="text-primary mt-1 font-mono">•</span>
                        <span className="font-mono text-xs sm:text-sm">
                          FULL COMMUNITY CONTROL/GOVERNANCE THROUGH THE DAO
                        </span>
                      </li>
                      <li className="flex items-start gap-2 sm:gap-3">
                        <span className="text-primary mt-1 font-mono">•</span>
                        <span className="font-mono text-xs sm:text-sm">GLOBAL MARKETING CAMPAIGN</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

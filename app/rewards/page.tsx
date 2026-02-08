"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Home, Gift, Coins, TrendingUp, Users, Clock, ExternalLink, RefreshCw, Menu, X } from 'lucide-react'
import Link from "next/link"
import { useRouter } from 'next/navigation'

const sections = [
  { id: "overview", title: "Overview", icon: Gift },
  { id: "how-it-works", title: "How It Works", icon: TrendingUp },
  { id: "data-info", title: "Data Info", icon: Clock },
]

interface RevshareData {
  totalBnbDistributed: number
  totalDistributions: number
  minimumRequired: number
  lastUpdated: string
  dataSource: string
}

interface ApiResponse {
  success: boolean
  data: RevshareData
  warning?: string
}

export default function RewardsPage() {
  const [activeSection, setActiveSection] = useState("overview")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [data, setData] = useState<RevshareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const router = useRouter()

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/revshare", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: ApiResponse = await response.json()

      if (result.success && result.data) {
        setData(result.data)
        setLastRefresh(new Date())
      } else {
        throw new Error("Invalid response format")
      }
    } catch (err) {
      console.error("Failed to fetch revshare data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

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

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    }).format(num)
  }

  const formatTokens = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num)
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col lg:flex-row overflow-hidden relative">
      <div className="lg:hidden flex items-center justify-between p-3 sm:p-4 border-b border-border/30 bg-background/95 backdrop-blur-sm">
        <h2 className="text-base sm:text-lg font-mono uppercase tracking-wide flex items-center gap-2 text-yellow-500">
          <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
          ALPHA REWARDS
        </h2>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-foreground hover:text-primary transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-background border-r border-border w-80 max-w-[80vw] h-full flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border/30">
              <h2 className="text-lg font-mono uppercase tracking-wide flex items-center gap-2 text-yellow-500">
                <Gift className="w-5 h-5" />
                ALPHA REWARDS
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
                    const isActive = activeSection === section.id
                    return (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        onClick={(e) => {
                          e.preventDefault()
                          scrollToSection(section.id)
                        }}
                        className={`w-full flex items-center gap-3 p-3 text-left font-mono uppercase text-sm tracking-wide transition-colors ${
                          isActive
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

      <div className="hidden lg:flex w-80 border-r border-border bg-background/50 backdrop-blur-sm flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b border-border/30 flex-shrink-0 h-[73px]">
          <h2 className="text-lg font-mono uppercase tracking-wide flex items-center gap-2 text-yellow-500">
            <Gift className="w-5 h-5" />
            ALPHA REWARDS
          </h2>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {sections.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                return (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToSection(section.id)
                    }}
                    className={`w-full flex items-center gap-3 p-3 text-left font-mono uppercase text-sm tracking-wide transition-colors ${
                      isActive
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
          <h3 className="text-lg font-mono uppercase tracking-wide">REWARD DISTRIBUTION</h3>
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="border-green-500/20 text-green-400">
              {loading ? "Loading..." : "Live Data"}
            </Badge>
            <Button onClick={fetchData} variant="outline" size="sm" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3 sm:p-6 space-y-12 sm:space-y-16">
              {/* Overview Section */}
              <section id="overview" className="scroll-mt-24">
                <h2 className="text-2xl sm:text-3xl font-mono uppercase mb-6 sm:mb-8 text-primary tracking-wide">
                  OVERVIEW
                </h2>

                {loading ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      <span className="text-lg font-mono">Loading reward data...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                    <div className="text-red-400 text-lg font-mono">Error loading reward data</div>
                    <div className="text-foreground/60 font-mono">{error}</div>
                    <Button onClick={fetchData} variant="outline" className="mt-4 bg-transparent">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      <div
                        className="bg-background/50 border border-border/50 backdrop-blur-sm p-4 sm:p-6"
                        style={{
                          clipPath:
                            "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-mono uppercase text-xs sm:text-sm tracking-wide text-foreground/70">
                            Total SOL Distributed
                          </h3>
                          <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-mono text-yellow-400 mb-2">
                          {data ? formatNumber(data.totalBnbDistributed) : "0"} SOL
                        </div>
                        <p className="text-xs font-mono text-foreground/50">Lifetime rewards distributed</p>
                      </div>

                      <div
                        className="bg-background/50 border border-border/50 backdrop-blur-sm p-4 sm:p-6"
                        style={{
                          clipPath:
                            "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-mono uppercase text-xs sm:text-sm tracking-wide text-foreground/70">
                            Total Distributions
                          </h3>
                          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-mono text-green-400 mb-2">
                          {data ? formatNumber(data.totalDistributions) : "0"}
                        </div>
                        <p className="text-xs font-mono text-foreground/50">Distribution events completed</p>
                      </div>

                      <div
                        className="bg-background/50 border border-border/50 backdrop-blur-sm p-4 sm:p-6 sm:col-span-2 lg:col-span-1"
                        style={{
                          clipPath:
                            "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
                        }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-mono uppercase text-xs sm:text-sm tracking-wide text-foreground/70">
                            Minimum Required
                          </h3>
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-mono text-blue-400 mb-2">
                          {data ? formatTokens(data.minimumRequired) : "0"}
                        </div>
                        <p className="text-xs font-mono text-foreground/50">Tokens needed for rewards</p>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* How It Works Section */}
              <section id="how-it-works" className="scroll-mt-24">
                <h2 className="text-2xl sm:text-3xl font-mono uppercase mb-6 sm:mb-8 text-primary tracking-wide">
                  HOW IT WORKS
                </h2>

                <div
                  className="bg-background/50 border border-border/50 backdrop-blur-sm p-4 sm:p-8"
                  style={{
                    clipPath:
                      "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
                  }}
                >
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-3 h-3 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-mono uppercase text-base sm:text-lg text-primary mb-2">
                          Hold Minimum Tokens
                        </h4>
                        <p className="font-mono text-xs sm:text-sm text-foreground/80 leading-relaxed">
                          Hold at least {data ? formatTokens(data.minimumRequired) : "1,000,000"} AI tokens to be
                          eligible for rewards. Your wallet is automatically tracked for eligibility.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-3 h-3 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-mono uppercase text-base sm:text-lg text-primary mb-2">
                          Automatic Distribution
                        </h4>
                        <p className="font-mono text-xs sm:text-sm text-foreground/80 leading-relaxed">
                          Rewards are automatically distributed to eligible holders based on their token holdings. No
                          manual claiming required - rewards appear directly in your wallet.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-3 h-3 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-mono uppercase text-base sm:text-lg text-primary mb-2">SOL Rewards</h4>
                        <p className="font-mono text-xs sm:text-sm text-foreground/80 leading-relaxed">
                          Receive SOL rewards directly to your wallet from bot trading profits. The more AI tokens you
                          hold, the larger your share of the reward pool.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-mono uppercase text-base sm:text-lg text-primary mb-2">
                          Real-Time Tracking
                        </h4>
                        <p className="font-mono text-xs sm:text-sm text-foreground/80 leading-relaxed">
                          All distributions are tracked in real-time and publicly verifiable on the blockchain. View
                          complete transparency of all reward distributions.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Data Information Section */}
              <section id="data-info" className="scroll-mt-24">
                <h2 className="text-2xl sm:text-3xl font-mono uppercase mb-6 sm:mb-8 text-primary tracking-wide">
                  DATA INFORMATION
                </h2>

                <div
                  className="bg-background/50 border border-border/50 backdrop-blur-sm p-4 sm:p-8"
                  style={{
                    clipPath:
                      "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
                  }}
                >
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between py-3 border-b border-border/30">
                      <span className="font-mono uppercase text-xs sm:text-sm tracking-wide text-foreground/70">
                        Last Updated
                      </span>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-foreground/50" />
                        <span className="font-mono text-xs sm:text-sm text-primary">
                          {lastRefresh.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-border/30">
                      <span className="font-mono uppercase text-xs sm:text-sm tracking-wide text-foreground/70">
                        Data Source
                      </span>
                      <Badge variant="outline" className="border-blue-500/20 text-blue-400 font-mono">
                        {data?.dataSource || "API"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-border/30">
                      <span className="font-mono uppercase text-xs sm:text-sm tracking-wide text-foreground/70">
                        Update Frequency
                      </span>
                      <span className="font-mono text-xs sm:text-sm text-primary">Real-time</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2 sm:gap-0">
                      <span className="font-mono uppercase text-xs sm:text-sm tracking-wide text-foreground/70">
                        Token Address
                      </span>
                      <span className="font-mono text-xs text-primary break-all">
                        6AxLMQp2nhS5kn7ciw7TDrQ5m45FNuRyReiieNPFBTAX
                      </span>
                    </div>

                    <div className="pt-4">
                      <Link
                        href="https://revshare.dev/token/6AxLMQp2nhS5kn7ciw7TDrQ5m45FNuRyReiieNPFBTAX"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors font-mono text-xs sm:text-sm"
                      >
                        <span>View on RevShare.dev</span>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
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

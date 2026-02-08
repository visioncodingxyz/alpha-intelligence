"use client"
import { Button } from "./ui/button"
import { useToast } from "./ui/use-toast"
import { useState } from "react"

export function ContractAddressBar() {
  const { toast } = useToast()
  const [isAnimating, setIsAnimating] = useState(false)
  const contractAddress = "6AxLMQp2nhS5kn7ciw7TDrQ5m45FNuRyReiieNPFBTAX"

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(contractAddress)
      setIsAnimating(true)
      toast({
        title: "Copied!",
        description: "Contract address copied to clipboard",
        duration: 2000,
      })
      setTimeout(() => setIsAnimating(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
        duration: 2000,
      })
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">Contract Address</p>
            <p className="font-mono text-sm text-foreground truncate">{contractAddress}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className={`shrink-0 h-8 px-3 bg-transparent transition-all duration-200 ${
              isAnimating
                ? "scale-95 bg-green-500/20 border-green-500/50 text-green-400"
                : "hover:bg-primary/10 hover:border-primary/50 hover:scale-105"
            }`}
            disabled={isAnimating}
          >
            <span className={`transition-all duration-200 ${isAnimating ? "scale-110" : ""}`}>
              {isAnimating ? "✓" : "Copy"}
            </span>
          </Button>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-border/30">
          <span className="text-[10px] text-muted-foreground/60">Built by</span>
          <a
            href="https://visioncoding.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-green-400 transition-colors"
          >
            <img
              src="/images/vision-coding-logo.png"
              alt="Vision Coding"
              className="h-3.5 w-3.5"
            />
            <span className="font-medium">Vision Coding</span>
          </a>
        </div>
      </div>
    </div>
  )
}

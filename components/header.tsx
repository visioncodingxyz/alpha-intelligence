"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "./logo"
import { MobileMenu } from "./mobile-menu"
import { Twitter, Send, ChevronDown, Lock } from "lucide-react"
import { GetCreditsModal } from "./get-credits-modal"
import { useState } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"

export const Header = () => {
  const pathname = usePathname()
  const isNonStickyPage = pathname === "/docs" || pathname === "/create"
  const [showCreditsModal, setShowCreditsModal] = useState(false)

  return (
    <div className={`${isNonStickyPage ? "relative" : "fixed top-0 left-0 w-full z-50"} pt-4 sm:pt-6 md:pt-8 lg:pt-14`}>
      <header className="flex items-center justify-between container px-4 sm:px-6">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="flex max-lg:hidden absolute left-1/2 -translate-x-1/2 items-center justify-center gap-x-6 xl:gap-x-10">
          <DropdownMenu>
            <DropdownMenuTrigger className="uppercase inline-flex items-center gap-1 font-mono text-sm xl:text-base text-foreground/60 hover:text-foreground/100 duration-150 transition-colors ease-out">
              EXPLORE
              <ChevronDown size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="bg-background border border-border">
              <DropdownMenuItem asChild>
                <Link
                  href="/gallery?type=images"
                  className="uppercase font-mono text-foreground/60 hover:text-foreground/100 duration-150 transition-colors ease-out cursor-pointer"
                >
                  IMAGES
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/gallery?type=videos"
                  className="uppercase font-mono text-foreground/60 hover:text-foreground/100 duration-150 transition-colors ease-out cursor-pointer"
                >
                  VIDEOS
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
                <span className="uppercase font-mono text-foreground/60 flex items-center gap-2">
                  NFTS
                  <Lock size={14} />
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
                <span className="uppercase font-mono text-foreground/60 flex items-center gap-2">
                  TOKENS
                  <Lock size={14} />
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className="uppercase inline-flex items-center gap-1 font-mono text-sm xl:text-base text-foreground/60 hover:text-foreground/100 duration-150 transition-colors ease-out">
              CREATE
              <ChevronDown size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="bg-background border border-border">
              <DropdownMenuItem asChild>
                <Link
                  href="/create"
                  className="uppercase font-mono text-foreground/60 hover:text-foreground/100 duration-150 transition-colors ease-out cursor-pointer"
                >
                  CREATE IMAGE
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/create?mode=video"
                  className="uppercase font-mono text-foreground/60 hover:text-foreground/100 duration-150 transition-colors ease-out cursor-pointer"
                >
                  GENERATE VIDEO
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/mint-nft"
                  className="uppercase font-mono text-foreground/60 hover:text-foreground/100 duration-150 transition-colors ease-out cursor-pointer"
                >
                  MINT NFT
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
                <span className="uppercase font-mono text-foreground/60 flex items-center gap-2">
                  NEW TOKEN
                  <Lock size={14} />
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className="uppercase inline-flex items-center gap-1 font-mono text-sm xl:text-base text-foreground/60 hover:text-foreground/100 duration-150 transition-colors ease-out">
              RESOURCES
              <ChevronDown size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="bg-background border border-border">
              <DropdownMenuItem asChild>
                <Link
                  href="/whitepaper"
                  className="uppercase font-mono text-foreground/60 hover:text-foreground/100 duration-150 transition-colors ease-out cursor-pointer"
                >
                  WHITEPAPER
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/docs"
                  className="uppercase font-mono text-foreground/60 hover:text-foreground/100 duration-150 transition-colors ease-out cursor-pointer"
                >
                  DOCS
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <div className="flex max-lg:hidden items-center gap-x-3 xl:gap-x-4">
          <div className="flex items-center mr-2">
            <Link
              href="https://x.com/alphaaisolana"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/60 hover:text-foreground/100 transition-colors duration-150 ease-out p-1"
              aria-label="Follow us on X"
            >
              <Twitter size={18} />
            </Link>
            <div className="w-2" />
            <Link
              href="https://t.me/alphaaisolana"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/60 hover:text-foreground/100 transition-colors duration-150 ease-out p-1"
              aria-label="Join our Telegram"
            >
              <Send size={18} />
            </Link>
          </div>
          <button
            onClick={() => setShowCreditsModal(true)}
            className="uppercase transition-colors ease-out duration-150 font-mono text-sm xl:text-base text-primary hover:text-primary/80"
          >
            GET CREDITS
          </button>
        </div>
        <MobileMenu />
      </header>

      <GetCreditsModal open={showCreditsModal} onOpenChange={setShowCreditsModal} />
    </div>
  )
}

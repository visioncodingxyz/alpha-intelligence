"use client"

import { cn } from "@/lib/utils"
import * as Dialog from "@radix-ui/react-dialog"
import { Menu, X, Twitter, Send, ChevronDown } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { GetCreditsModal } from "./get-credits-modal"

interface MobileMenuProps {
  className?: string
}

export const MobileMenu = ({ className }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showCreditsModal, setShowCreditsModal] = useState(false)
  const [showResourcesSubmenu, setShowResourcesSubmenu] = useState(false)

  const menuItems = [{ name: "GALLERY", href: "/gallery" }]

  const handleLinkClick = () => {
    setIsOpen(false)
    setShowResourcesSubmenu(false)
  }

  const handleGetCreditsClick = () => {
    setIsOpen(false)
    setShowCreditsModal(true)
  }

  const toggleResourcesSubmenu = () => {
    setShowResourcesSubmenu(!showResourcesSubmenu)
  }

  return (
    <>
      <Dialog.Root modal={false} open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <button
            className={cn("group lg:hidden p-2 text-foreground transition-colors", className)}
            aria-label="Open menu"
          >
            <Menu className="group-[[data-state=open]]:hidden" size={24} />
            <X className="hidden group-[[data-state=open]]:block" size={24} />
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <div data-overlay="true" className="fixed z-30 inset-0 bg-black/50 backdrop-blur-sm" />

          <Dialog.Content
            onInteractOutside={(e) => {
              if (e.target instanceof HTMLElement && e.target.dataset.overlay !== "true") {
                e.preventDefault()
              }
            }}
            className="fixed top-0 left-0 w-full z-40 py-20 sm:py-28 md:py-40"
          >
            <Dialog.Title className="sr-only">Menu</Dialog.Title>

            <nav className="flex flex-col space-y-4 sm:space-y-6 container mx-auto px-6 sm:px-8">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className="text-lg sm:text-xl font-mono uppercase text-foreground/60 transition-colors ease-out duration-150 hover:text-foreground/100 py-2 border-b border-border/20 hover:border-primary/30"
                >
                  {item.name}
                </Link>
              ))}

              <div className="py-2 border-b border-border/20">
                <button
                  onClick={toggleResourcesSubmenu}
                  className="flex items-center gap-2 text-lg sm:text-xl font-mono uppercase text-foreground/60 transition-colors ease-out duration-150 hover:text-foreground/100 w-full"
                >
                  RESOURCES
                  <ChevronDown
                    size={20}
                    className={`transition-transform duration-200 ${showResourcesSubmenu ? "rotate-180" : ""}`}
                  />
                </button>
                {showResourcesSubmenu && (
                  <div className="ml-4 mt-3 space-y-3 pb-2">
                    <Link
                      href="/whitepaper"
                      onClick={handleLinkClick}
                      className="block text-base sm:text-lg font-mono uppercase text-foreground/60 transition-colors ease-out duration-150 hover:text-foreground/100 py-1"
                    >
                      WHITEPAPER
                    </Link>
                    <Link
                      href="/docs"
                      onClick={handleLinkClick}
                      className="block text-base sm:text-lg font-mono uppercase text-foreground/60 transition-colors ease-out duration-150 hover:text-foreground/100 py-1"
                    >
                      DOCS
                    </Link>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-x-6 mt-6 pt-4 border-t border-border/20">
                <Link
                  href="https://x.com/alphaaisolana"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLinkClick}
                  className="text-foreground/60 hover:text-foreground/100 transition-colors duration-150 ease-out p-2"
                  aria-label="Follow us on X"
                >
                  <Twitter size={24} />
                </Link>
                <Link
                  href="https://t.me/alphaaisolana"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLinkClick}
                  className="text-foreground/60 hover:text-foreground/100 transition-colors duration-150 ease-out p-2"
                  aria-label="Join our Telegram"
                >
                  <Send size={24} />
                </Link>
              </div>

              <div className="mt-6 pt-4">
                <button
                  onClick={handleGetCreditsClick}
                  className="inline-block text-lg sm:text-xl font-mono uppercase text-primary transition-colors ease-out duration-150 hover:text-primary/80 py-2 px-4 border border-primary/30 hover:border-primary/50 rounded-sm"
                >
                  GET CREDITS
                </button>
              </div>
            </nav>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <GetCreditsModal open={showCreditsModal} onOpenChange={setShowCreditsModal} />
    </>
  )
}

import type React from "react"
import type { Metadata } from "next"
import { Geist_Mono } from "next/font/google"
import "./globals.css"
import { ClientLayout } from "./client-layout"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Alpha Intelligence - Advanced AI Image Generation & Chatbot",
  description:
    "Alpha Intelligence is an advanced AI platform for creators, artists, and innovators. Generate stunning AI images and chat with intelligent assistants powered by cutting-edge AI technology.",
  generator: "v0.app",
  keywords: [
    "AI generator",
    "AI images",
    "artificial intelligence",
    "image generation",
    "AI chatbot",
    "Solana",
    "SOL",
    "creative AI",
    "AI assistant",
  ],
  robots: "index, follow",
  openGraph: {
    title: "Alpha Intelligence - Advanced AI Image Generation & Chatbot",
    description:
      "Alpha Intelligence is an advanced AI platform for creators, artists, and innovators. Generate stunning AI images and chat with intelligent assistants powered by cutting-edge AI technology.",
    type: "website",
    images: [
      {
        url: "/images/alpha-og-image.png",
        width: 1200,
        height: 630,
        alt: "Alpha Intelligence - Advanced AI Platform for Creators and Innovators",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alpha Intelligence - Advanced AI Image Generation & Chatbot",
    description:
      "Alpha Intelligence is an advanced AI platform for creators, artists, and innovators. Generate stunning AI images and chat with intelligent assistants powered by cutting-edge AI technology.",
    images: ["/images/alpha-og-image.png"],
  },
  icons: {
    icon: [
      { url: "/alpha-favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/alpha-favicon.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/alpha-favicon.png",
    apple: "/alpha-favicon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased`} suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

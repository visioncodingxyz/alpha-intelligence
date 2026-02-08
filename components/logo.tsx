import type React from "react"
import Image from "next/image"

export const Logo = (props: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className="flex items-center gap-3 min-w-fit" {...props}>
      <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
        <Image src="/images/alpha-logo.png" alt="Alpha Intelligence Logo" width={32} height={32} className="w-8 h-8" />
      </div>
      <span className="font-mono text-white font-bold text-lg whitespace-nowrap">Alpha Intelligence</span>
    </div>
  )
}

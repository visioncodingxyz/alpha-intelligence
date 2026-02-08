export function Roadmap() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-sentient text-center mb-16 text-primary">Roadmap</h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="bg-gray-900/50 border border-border rounded-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🚀</span>
                <h3 className="text-2xl font-sentient text-primary">Phase 1: Launch</h3>
              </div>

              <div className="inline-block bg-yellow-600/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-mono mb-6">
                In Progress
              </div>

              <ul className="space-y-3 text-foreground/80">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  Launch token on Raydium
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  Build a strong community on Telegram and X
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  Release a beta version of the AI Image Generator
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  Get listed on CoinGecko
                </li>
              </ul>
            </div>

            <div className="bg-gray-900/50 border border-border rounded-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">📈</span>
                <h3 className="text-2xl font-sentient text-primary">Phase 2: Growth</h3>
              </div>

              <div className="inline-block bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-sm font-mono mb-6">
                Coming Soon
              </div>

              <ul className="space-y-3 text-foreground/80">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  Get verified on Jupiter Exchange
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  List on CoinMarketCap
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  Release the official community voting system (XXX DAO)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  Release the full-featured version of our AI Image Generator
                </li>
              </ul>
            </div>

            <div className="bg-gray-900/50 border border-border rounded-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">🌟</span>
                <h3 className="text-2xl font-sentient text-primary">Phase 3: Big Time</h3>
              </div>

              <div className="inline-block bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-sm font-mono mb-6">
                Future
              </div>

              <ul className="space-y-3 text-foreground/80">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  List on major centralized exchanges (Binance, Coinbase)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  Launch a mobile app for the AI Image Generator
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  Full community control/governance through the DAO
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  Global marketing campaign
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { NextResponse } from "next/server"
import { sql } from "@/lib/neon"

interface DexscreenerPair {
  chainId: string
  dexId: string
  pairAddress: string
  baseToken: {
    address: string
    name: string
    symbol: string
  }
  quoteToken: {
    address: string
    name: string
    symbol: string
  }
  priceUsd: string
  volume: {
    h24: number
    h6: number
    h1: number
    m5: number
  }
  priceChange: {
    h24: number
    h6: number
    h1: number
    m5: number
  }
  liquidity: {
    usd: number
    base: number
    quote: number
  }
  fdv: number
  marketCap: number
}

interface DexscreenerResponse {
  schemaVersion: string
  pairs: DexscreenerPair[]
}

async function fetchTokenPriceData(mintAddress: string): Promise<{
  price: number
  marketCap: number
  volume24h: number
  priceChange24h: number
} | null> {
  try {
    console.log(`[v0] Fetching price data for token: ${mintAddress}`)

    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`, {
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      console.error(`[v0] Dexscreener API error: ${response.status}`)
      return null
    }

    const data: DexscreenerResponse = await response.json()
    console.log(`[v0] Dexscreener response for ${mintAddress}:`, data.pairs?.length || 0, "pairs found")

    if (data.pairs && data.pairs.length > 0) {
      console.log(
        `[v0] All pairs for ${mintAddress}:`,
        data.pairs.map((pair) => ({
          chainId: pair.chainId,
          dexId: pair.dexId,
          pairAddress: pair.pairAddress,
          liquidity: pair.liquidity?.usd,
          priceUsd: pair.priceUsd,
        })),
      )
    }

    const validPairs = data.pairs?.filter((pair) => {
      // For Meteora DBC tokens, check if we have price data even without liquidity
      if (pair.dexId === "meteoradbc" && pair.priceUsd && Number.parseFloat(pair.priceUsd) > 0) {
        return true
      }
      // For regular DEX pairs, require liquidity
      return pair.liquidity?.usd > 0
    })

    if (!validPairs || validPairs.length === 0) {
      console.log(`[v0] No trading pairs found for token: ${mintAddress}`)
      return null
    }

    let bestPair = validPairs[0]

    // If it's a Meteora DBC token, try to get detailed pair data
    if (bestPair.dexId === "meteoradbc" && bestPair.pairAddress) {
      console.log(`[v0] Fetching detailed Meteora DBC pair data for: ${bestPair.pairAddress}`)

      try {
        const pairResponse = await fetch(
          `https://api.dexscreener.com/latest/dex/pairs/solana/${bestPair.pairAddress}`,
          {
            headers: {
              Accept: "application/json",
            },
          },
        )

        if (pairResponse.ok) {
          const pairData: DexscreenerResponse = await pairResponse.json()
          if (pairData.pairs && pairData.pairs.length > 0) {
            bestPair = pairData.pairs[0]
            console.log(`[v0] Enhanced Meteora DBC pair data:`, {
              priceUsd: bestPair.priceUsd,
              marketCap: bestPair.marketCap,
              volume24h: bestPair.volume?.h24,
              priceChange24h: bestPair.priceChange?.h24,
            })
          }
        }
      } catch (error) {
        console.log(`[v0] Could not fetch enhanced pair data, using basic data:`, error)
      }
    } else {
      // For regular DEX pairs, get the one with highest liquidity
      bestPair = validPairs.reduce((prev, current) =>
        (current.liquidity?.usd || 0) > (prev.liquidity?.usd || 0) ? current : prev,
      )
    }

    console.log(`[v0] Final pair data for ${mintAddress}:`, {
      chainId: bestPair.chainId,
      pairAddress: bestPair.pairAddress,
      dexId: bestPair.dexId,
      price: bestPair.priceUsd,
      marketCap: bestPair.marketCap,
      volume24h: bestPair.volume?.h24,
      liquidity: bestPair.liquidity?.usd,
    })

    return {
      price: Number.parseFloat(bestPair.priceUsd || "0"),
      marketCap: bestPair.marketCap || 0,
      volume24h: bestPair.volume?.h24 || 0,
      priceChange24h: bestPair.priceChange?.h24 || 0,
    }
  } catch (error) {
    console.error(`[v0] Error fetching price data for ${mintAddress}:`, error)
    return null
  }
}

export async function GET() {
  try {
    // Fetch all visible tokens from the database, ordered by creation date (newest first)
    const tokens = await sql`
      SELECT 
        id,
        mint_address,
        name,
        ticker,
        description,
        image_url,
        website,
        twitter,
        telegram,
        visible,
        decimals,
        tax_tier,
        initial_buy,
        reward_ca,
        mode,
        dev_fee_percentage,
        bonding_curve_type,
        developer_wallet,
        transaction_signature,
        created_at,
        updated_at,
        nsfw
      FROM tokens 
      WHERE visible = 0
      ORDER BY created_at DESC
    `

    const transformedTokens = await Promise.all(
      tokens.map(async (token: any) => {
        const priceData = await fetchTokenPriceData(token.mint_address)

        return {
          id: token.id,
          mintAddress: token.mint_address,
          name: token.name,
          ticker: token.ticker,
          description: token.description,
          imageUrl: token.image_url,
          website: token.website,
          twitter: token.twitter,
          telegram: token.telegram,
          createdAt: token.created_at,
          developerWallet: token.developer_wallet,
          mode: token.mode,
          taxTier: token.tax_tier,
          initialBuy: token.initial_buy,
          bondingCurveType: token.bonding_curve_type,
          dev_fee_percentage: token.dev_fee_percentage,
          marketCap: priceData?.marketCap || 0,
          volume24h: priceData?.volume24h || 0,
          price: priceData?.price || 0,
          priceChange24h: priceData?.priceChange24h || 0,
          nsfw: token.nsfw || false,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      tokens: transformedTokens,
    })
  } catch (error) {
    console.error("Error fetching tokens:", error)
    return NextResponse.json({ message: "Failed to fetch tokens" }, { status: 500 })
  }
}

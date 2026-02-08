import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const galleryItemId = searchParams.get("galleryItemId")
    const galleryItemIds = searchParams.get("galleryItemIds")
    const userIdentifier = searchParams.get("userIdentifier")

    if (!userIdentifier) {
      return NextResponse.json({ error: "Missing user identifier" }, { status: 400 })
    }

    if (!sql) {
      return NextResponse.json({
        success: true,
        hasVoted: false,
        votes: {},
        warning: "Database not available",
      })
    }

    if (galleryItemIds) {
      const itemIds = galleryItemIds.split(",").filter((id) => id.trim())

      if (itemIds.length === 0) {
        return NextResponse.json({ success: true, votes: {} })
      }

      try {
        // Convert all IDs to bigint
        const bigIntIds = itemIds
          .map((id) => {
            try {
              return BigInt(id.trim())
            } catch {
              return null
            }
          })
          .filter((id) => id !== null)

        if (bigIntIds.length === 0) {
          return NextResponse.json({ success: true, votes: {} })
        }

        // Get user votes for all items in one query
        const userVotes = await sql`
          SELECT gallery_item_id, vote_type 
          FROM photo_votes 
          WHERE gallery_item_id = ANY(${bigIntIds}) AND user_identifier = ${userIdentifier}
        `

        // Convert to object format
        const votes: Record<string, string> = {}
        userVotes.forEach((vote) => {
          votes[vote.gallery_item_id.toString()] = vote.vote_type
        })

        return NextResponse.json({
          success: true,
          votes,
        })
      } catch (dbError) {
        console.error("Batch vote status error:", dbError)
        return NextResponse.json({
          success: true,
          votes: {},
          warning: "Failed to load vote statuses",
        })
      }
    }

    if (!galleryItemId) {
      return NextResponse.json({ error: "Missing gallery item ID(s)" }, { status: 400 })
    }

    // Convert galleryItemId to bigint for database operations
    let galleryItemIdBigInt: bigint
    try {
      galleryItemIdBigInt = BigInt(galleryItemId)
    } catch (error) {
      return NextResponse.json({ error: "Invalid gallery item ID" }, { status: 400 })
    }

    try {
      // Get user's vote status for this item
      const userVote = await sql`
        SELECT vote_type FROM photo_votes 
        WHERE gallery_item_id = ${galleryItemIdBigInt} AND user_identifier = ${userIdentifier}
      `

      // Get total vote counts for this item
      const voteCounts = await sql`
        SELECT upvotes, downvotes, vote_ratio FROM gallery_items 
        WHERE id = ${galleryItemIdBigInt}
      `

      const hasVoted = userVote.length > 0
      const voteType = hasVoted ? userVote[0].vote_type : null
      const upvotes = voteCounts.length > 0 ? Number(voteCounts[0].upvotes) : 0
      const downvotes = voteCounts.length > 0 ? Number(voteCounts[0].downvotes) : 0
      const voteRatio = voteCounts.length > 0 ? Number(voteCounts[0].vote_ratio) : 0

      return NextResponse.json({
        success: true,
        hasVoted,
        voteType,
        upvotes,
        downvotes,
        voteRatio,
      })
    } catch (dbError) {
      console.error("Vote status error:", dbError)
      return NextResponse.json({
        success: true,
        hasVoted: false,
        warning: "Failed to load vote status",
      })
    }
  } catch (error) {
    console.error("Vote status API error:", error)
    return NextResponse.json({ error: "Failed to get vote status" }, { status: 500 })
  }
}

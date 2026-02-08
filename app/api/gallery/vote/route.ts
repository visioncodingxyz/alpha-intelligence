import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { galleryItemId, voteType, userIdentifier } = await request.json()

    if (!galleryItemId || !voteType || !userIdentifier) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["upvote", "downvote"].includes(voteType)) {
      return NextResponse.json({ error: "Invalid vote type" }, { status: 400 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Convert galleryItemId to bigint for database operations
    let galleryItemIdBigInt: bigint
    try {
      galleryItemIdBigInt = BigInt(galleryItemId)
    } catch (error) {
      return NextResponse.json({ error: "Invalid gallery item ID" }, { status: 400 })
    }

    try {
      // Check if user has already voted on this item
      const existingVote = await sql`
        SELECT id, vote_type FROM photo_votes 
        WHERE gallery_item_id = ${galleryItemIdBigInt} AND user_identifier = ${userIdentifier}
      `

      if (existingVote.length > 0) {
        const currentVote = existingVote[0]

        if (currentVote.vote_type === voteType) {
          // Same vote type - remove the vote (toggle off)
          await sql`
            DELETE FROM photo_votes 
            WHERE id = ${currentVote.id}
          `
        } else {
          // Different vote type - update the vote
          await sql`
            UPDATE photo_votes 
            SET vote_type = ${voteType}, updated_at = ${new Date().toISOString()}
            WHERE id = ${currentVote.id}
          `
        }
      } else {
        // No existing vote - create new vote
        await sql`
          INSERT INTO photo_votes (gallery_item_id, user_identifier, vote_type, created_at, updated_at)
          VALUES (${galleryItemIdBigInt}, ${userIdentifier}, ${voteType}, ${new Date().toISOString()}, ${new Date().toISOString()})
        `
      }

      // Update vote counts and ratio in gallery_items
      const voteCounts = await sql`
        SELECT 
          COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) as upvotes,
          COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as downvotes
        FROM photo_votes 
        WHERE gallery_item_id = ${galleryItemIdBigInt}
      `

      const upvotes = Number(voteCounts[0].upvotes)
      const downvotes = Number(voteCounts[0].downvotes)
      const totalVotes = upvotes + downvotes
      const voteRatio = totalVotes > 0 ? upvotes / totalVotes : 0

      await sql`
        UPDATE gallery_items 
        SET upvotes = ${upvotes}, downvotes = ${downvotes}, vote_ratio = ${voteRatio}, updated_at = ${new Date().toISOString()}
        WHERE id = ${galleryItemIdBigInt}
      `

      return NextResponse.json({
        success: true,
        upvotes,
        downvotes,
        voteRatio,
      })
    } catch (dbError) {
      console.error("Database vote error:", dbError)
      return NextResponse.json({ error: "Database operation failed" }, { status: 503 })
    }
  } catch (error) {
    console.error("Vote API error:", error)
    return NextResponse.json({ error: "Failed to process vote" }, { status: 500 })
  }
}

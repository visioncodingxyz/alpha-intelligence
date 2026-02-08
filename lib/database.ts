import { neon } from "@neondatabase/serverless"

const getDatabaseUrl = () => {
  console.log("[v0] Checking for database environment variables...")

  // Try different possible environment variable names
  const possibleUrls = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
  ]

  // Debug: Log which env vars are available
  console.log("[v0] Environment variables check:", {
    DATABASE_URL: process.env.DATABASE_URL ? "✓ Available" : "✗ Missing",
    POSTGRES_URL: process.env.POSTGRES_URL ? "✓ Available" : "✗ Missing",
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL ? "✓ Available" : "✗ Missing",
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING ? "✓ Available" : "✗ Missing",
  })

  for (const url of possibleUrls) {
    if (url && url.trim()) {
      console.log("[v0] Using database URL from environment")
      return url
    }
  }

  console.warn("[v0] No database URL found. Database features will be disabled.")
  return null
}

const databaseUrl = getDatabaseUrl()
export const sql = databaseUrl ? neon(databaseUrl) : null

export async function executeQuery(query: string, params: any[] = []) {
  if (!sql) {
    console.error("[v0] Database not configured. Please check your Neon integration.")
    throw new Error("Database not configured. Please set up your Neon integration.")
  }

  try {
    console.log("[v0] Executing database query...")
    const result = await sql(query, params)
    console.log("[v0] Database query successful")
    return result
  } catch (error) {
    console.error("[v0] Database query error:", error)
    throw error
  }
}

// Test database connection
export async function testConnection() {
  if (!sql) {
    console.warn("[v0] Database connection not available")
    return false
  }

  try {
    console.log("[v0] Testing database connection...")
    await sql`SELECT 1`
    console.log("[v0] Database connection successful")
    return true
  } catch (error) {
    console.error("[v0] Database connection failed:", error)
    return false
  }
}

// Check if database is available
export function isDatabaseAvailable(): boolean {
  const available = sql !== null
  console.log("[v0] Database availability check:", available ? "✓ Available" : "✗ Not available")
  return available
}

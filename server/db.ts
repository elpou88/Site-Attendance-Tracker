import { drizzle } from "drizzle-orm/node-postgres"
import pkg from "pg"

const { Pool } = pkg

// Use Replit's built-in database (reliable, already configured)
// RAILWAY_DATABASE_URL kept as optional override if ever accessible
const dbUrl = process.env.DATABASE_URL || "";

if (!dbUrl) {
  throw new Error("No DATABASE_URL configured.");
}

const isInternal = dbUrl.includes("helium") || dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1") || dbUrl.includes(".internal");

const pool = new Pool({
  connectionString: dbUrl,
  ssl: isInternal ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

export const db = drizzle(pool)

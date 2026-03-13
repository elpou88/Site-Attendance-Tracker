import { drizzle } from "drizzle-orm/node-postgres"
import pkg from "pg"

const { Pool } = pkg

// On Railway production: DATABASE_URL = internal railway URL (works natively)
// On Replit dev: DATABASE_URL = Replit's built-in Helium DB
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

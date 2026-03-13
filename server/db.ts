import { drizzle } from "drizzle-orm/node-postgres"
import pkg from "pg"

const { Pool } = pkg

const dbUrl = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL || "";

if (!dbUrl) {
  throw new Error("No database URL configured. Set RAILWAY_DATABASE_URL.");
}

const isInternal = dbUrl.includes(".internal") || dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1") || dbUrl.includes("helium");

const pool = new Pool({
  connectionString: dbUrl,
  ssl: isInternal ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

export const db = drizzle(pool)

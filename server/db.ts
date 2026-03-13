import { drizzle } from "drizzle-orm/node-postgres"
import pkg from "pg"

const { Pool } = pkg

const dbUrl = process.env.DATABASE_URL || "";
const isInternalDb = dbUrl.includes("helium") || dbUrl.includes(".internal") || dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1");

const pool = new Pool({
  connectionString: dbUrl,
  ssl: isInternalDb ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
})

export const db = drizzle(pool)

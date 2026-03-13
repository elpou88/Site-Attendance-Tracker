import { drizzle } from "drizzle-orm/node-postgres"
import pkg from "pg"
import { getDbUrl, isSslDisabled } from "./db-url"

const { Pool } = pkg

const dbUrl = getDbUrl();
const pool = new Pool({
  connectionString: dbUrl,
  ssl: isSslDisabled(dbUrl) ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

export const db = drizzle(pool)

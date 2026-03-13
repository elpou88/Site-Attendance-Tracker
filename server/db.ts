import { drizzle } from "drizzle-orm/node-postgres"
import pkg from "pg"
import { getDbUrl, isSslDisabled } from "./db-url"

const { Pool } = pkg

const dbUrl = getDbUrl();
const pool = new Pool({
  connectionString: dbUrl,
  ssl: isSslDisabled(dbUrl) ? false : { rejectUnauthorized: false },
  max: 10,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
  allowExitOnIdle: false,
})

pool.on("error", (err: Error) => {
  console.error("[db] Unexpected pool client error:", err.message);
})

pool.on("connect", () => {
  console.log("[db] New client connected to pool");
})

export const db = drizzle(pool)

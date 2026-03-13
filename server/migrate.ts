import pg from "pg";
import { getDbUrl, isSslDisabled } from "./db-url";

export async function runMigrations() {
  const dbUrl = getDbUrl();

  if (!dbUrl) {
    console.log("[migrate] No database URL found, skipping migrations");
    return;
  }

  console.log("[migrate] Connecting to database...");

  const client = new pg.Client({
    connectionString: dbUrl,
    connectionTimeoutMillis: 10000,
    ssl: isSslDisabled(dbUrl) ? false : { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("[migrate] Connected to database, running migrations...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'worker',
        active BOOLEAN NOT NULL DEFAULT true,
        contract_type TEXT,
        contract_start_date DATE,
        contract_expiry_date DATE,
        sick_days_total INTEGER DEFAULT 0,
        sick_days_used INTEGER DEFAULT 0,
        holiday_days_total INTEGER DEFAULT 0,
        holiday_days_used INTEGER DEFAULT 0
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
        user_id VARCHAR NOT NULL,
        date DATE NOT NULL,
        sign_in_time TIMESTAMP NOT NULL,
        sign_out_time TIMESTAMP,
        sign_in_lat DOUBLE PRECISION,
        sign_in_lng DOUBLE PRECISION,
        sign_out_lat DOUBLE PRECISION,
        sign_out_lng DOUBLE PRECISION
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS feed_entries (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
        user_id VARCHAR NOT NULL,
        note TEXT,
        image_url TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::varchar,
        user_id VARCHAR NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log("[migrate] Migrations completed successfully");
  } catch (err) {
    console.error("[migrate] Migration error:", err);
    throw err;
  } finally {
    await client.end();
  }
}

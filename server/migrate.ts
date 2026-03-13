import pg from "pg";
import { getDbUrl, isSslDisabled, parseDbUrl } from "./db-url";

function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.username}:***@${u.host}${u.pathname}`;
  } catch {
    return "(invalid url)";
  }
}

export async function runMigrations() {
  const dbUrl = getDbUrl();

  if (!dbUrl) {
    console.log("[migrate] No database URL found, skipping migrations");
    return;
  }

  const sslDisabled = isSslDisabled(dbUrl);
  const parsed = parseDbUrl(dbUrl);

  console.log(`[migrate] Connecting to: ${maskUrl(dbUrl)}`);
  console.log(`[migrate] SSL: ${sslDisabled ? "disabled" : "enabled"}`);

  const client = new pg.Client({
    host: parsed.host,
    port: parsed.port,
    user: parsed.user,
    password: parsed.password,
    database: parsed.database,
    connectionTimeoutMillis: 20000,
    ssl: sslDisabled ? false : { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("[migrate] Connected successfully, running migrations...");

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

    console.log("[migrate] All tables created/verified successfully");
  } catch (err: any) {
    console.error(`[migrate] Connection failed: ${err.message}`);
    console.error(`[migrate] Host: ${parsed.host}:${parsed.port} DB: ${parsed.database}`);
    throw err;
  } finally {
    try { await client.end(); } catch {}
  }
}

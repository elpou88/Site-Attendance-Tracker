export function getDbUrl(): string {
  const url = process.env.DATABASE_URL || "";

  // If DATABASE_URL looks valid (has a proper hostname, not just 'base' or empty)
  if (url && !url.match(/[@/](base|localhost)([:/]|$)/) && url.includes("://")) {
    return url;
  }

  // Fallback: build URL from individual Railway/Postgres env vars
  const host =
    process.env.PGHOST ||
    process.env.POSTGRES_HOST ||
    process.env.RAILWAY_PRIVATE_DOMAIN ||
    "";
  const port = process.env.PGPORT || process.env.POSTGRES_PORT || "5432";
  const user = process.env.PGUSER || process.env.POSTGRES_USER || "postgres";
  const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || "";
  const database = process.env.PGDATABASE || process.env.POSTGRES_DB || "railway";

  if (host) {
    const built = `postgresql://${user}:${password}@${host}:${port}/${database}`;
    console.log(`[db] Built connection URL from env vars (host: ${host})`);
    return built;
  }

  console.error("[db] No valid database URL found in environment");
  return url;
}

export function isSslDisabled(url: string): boolean {
  return (
    url.includes("helium") ||
    url.includes(".internal") ||
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("sslmode=disable")
  );
}

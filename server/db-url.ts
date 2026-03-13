export interface ParsedDbUrl {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export function parseDbUrl(url: string): ParsedDbUrl {
  try {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: parseInt(u.port || "5432", 10),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, "").split("?")[0],
    };
  } catch {
    return { host: "localhost", port: 5432, user: "postgres", password: "", database: "postgres" };
  }
}

export function getDbUrl(): string {
  // Replit internal database — always prefer this when available
  const pgHost = process.env.PGHOST || "";
  if (pgHost && (pgHost === "helium" || pgHost.endsWith(".helium"))) {
    const user = process.env.PGUSER || "postgres";
    const password = process.env.PGPASSWORD || "";
    const db = process.env.PGDATABASE || "heliumdb";
    const port = process.env.PGPORT || "5432";
    const built = `postgresql://${user}:${encodeURIComponent(password)}@${pgHost}:${port}/${db}`;
    console.log(`[db] Using Replit internal database (host: ${pgHost})`);
    return built;
  }

  // Railway internal private URL (preferred over public proxy)
  const privateUrl = process.env.DATABASE_PRIVATE_URL || "";
  if (privateUrl && privateUrl.includes("://")) {
    console.log("[db] Using DATABASE_PRIVATE_URL (Railway internal)");
    return privateUrl;
  }

  // Standard DATABASE_URL
  const url = process.env.DATABASE_URL || "";
  if (url && url.includes("://")) {
    console.log("[db] Using DATABASE_URL");
    return url;
  }

  // Fallback: build URL from individual env vars
  const host =
    process.env.POSTGRES_HOST ||
    process.env.RAILWAY_PRIVATE_DOMAIN ||
    pgHost ||
    "";
  const port = process.env.PGPORT || process.env.POSTGRES_PORT || "5432";
  const user = process.env.PGUSER || process.env.POSTGRES_USER || "postgres";
  const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || "";
  const database = process.env.PGDATABASE || process.env.POSTGRES_DB || "postgres";

  if (host) {
    const built = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
    console.log(`[db] Built connection URL from env vars (host: ${host})`);
    return built;
  }

  console.error("[db] No valid database URL found in environment");
  return url;
}

export function isSslDisabled(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname;
    return (
      host === "helium" ||
      host.endsWith(".helium") ||
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".railway.internal") ||
      host === "railway.internal" ||
      u.searchParams.get("sslmode") === "disable"
    );
  } catch {
    return false;
  }
}

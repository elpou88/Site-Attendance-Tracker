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

export function logDbEnvDiagnostics() {
  const vars = [
    "DATABASE_PRIVATE_URL",
    "DATABASE_URL",
    "PGHOST",
    "PGPORT",
    "PGUSER",
    "PGDATABASE",
    "PGPASSWORD",
    "POSTGRES_HOST",
    "POSTGRES_PORT",
    "POSTGRES_USER",
    "POSTGRES_DB",
  ];
  console.log("[db] ENV CHECK:");
  for (const v of vars) {
    const val = process.env[v];
    if (!val) {
      console.log(`[db]   ${v} = NOT SET`);
    } else if (v.toLowerCase().includes("password") || v.toLowerCase().includes("url") || v.toLowerCase().includes("private")) {
      try {
        const u = new URL(val);
        console.log(`[db]   ${v} = SET (host=${u.hostname} port=${u.port || 5432} db=${u.pathname.replace(/^\//, "")})`);
      } catch {
        console.log(`[db]   ${v} = SET (not a URL, length=${val.length})`);
      }
    } else {
      console.log(`[db]   ${v} = ${val}`);
    }
  }
}

export function getDbUrl(): string {
  logDbEnvDiagnostics();

  // Railway provides DATABASE_PRIVATE_URL for internal connections
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

  // Fallback: build URL from individual Railway/Postgres env vars
  const host =
    process.env.PGHOST ||
    process.env.POSTGRES_HOST ||
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
    // Only disable SSL for truly internal/local connections
    return (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "helium" ||
      host.endsWith(".helium") ||
      host.endsWith(".railway.internal") ||
      host === "railway.internal" ||
      u.searchParams.get("sslmode") === "disable"
    );
  } catch {
    return false;
  }
}

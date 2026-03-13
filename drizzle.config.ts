import { defineConfig } from "drizzle-kit";

const dbUrl = process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL is not set — ensure the database is provisioned and linked");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});

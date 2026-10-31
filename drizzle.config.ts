import "dotenv/config";
import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit configuration.
 * Works with any Postgres endpoint — including Neon serverless Postgres —
 * because it simply reads `DATABASE_URL`.
 *
 *   npx drizzle-kit push        -> apply the schema to the database
 *   npx drizzle-kit generate    -> emit SQL migrations
 *   npx drizzle-kit studio      -> browse live data
 */
const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

export default {
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: databaseUrl },
  verbose: true,
  strict: true,
} satisfies Config;

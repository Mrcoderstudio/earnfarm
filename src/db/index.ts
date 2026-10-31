import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "Missing DATABASE_URL — add your Neon pooled connection string to .env.local",
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __earnFarmPool?: Pool;
};

/**
 * Neon is a serverless database: connections are cheap to open but must not be
 * held forever, so we keep a tiny pool with an aggressive idle timeout and let
 * the socket close itself between requests.
 */
export const pool =
  globalForDb.__earnFarmPool ??
  new Pool({
    connectionString: databaseUrl,
    max: 3,
    idleTimeoutMillis: 8000,
    connectionTimeoutMillis: 15000,
    allowExitOnIdle: true,
    // Neon requires TLS; explicit `sslmode=` in the connection string always wins.
    ssl: /neon\.tech/.test(databaseUrl) && !/sslmode=/.test(databaseUrl) ? true : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__earnFarmPool = pool;
}

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });

export { schema };

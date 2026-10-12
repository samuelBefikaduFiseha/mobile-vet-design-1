import "server-only";
import { Pool, types, type PoolClient, type QueryResultRow } from "pg";

// Return DATE / TIMESTAMPTZ as strings and NUMERIC / BIGINT as numbers, so rows
// can be passed straight to Client Components without Date/BigInt surprises.
types.setTypeParser(1082, (v) => v); // date -> "YYYY-MM-DD"
types.setTypeParser(1184, (v) => new Date(v).toISOString()); // timestamptz
types.setTypeParser(1114, (v) => new Date(v + "Z").toISOString()); // timestamp
types.setTypeParser(1700, (v) => parseFloat(v)); // numeric
types.setTypeParser(20, (v) => parseInt(v, 10)); // int8 / count(*)

const globalForDb = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString:
      process.env.DATABASE_URL ?? "postgres://mobilevet:mobilevet@localhost:5433/mobilevet",
    max: 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;

// An idle connection dropped by the server (e.g. DB restart) must not crash the app;
// the pool simply opens a fresh connection for the next query.
if (!pool.listenerCount("error")) pool.on("error", (err) => console.error("[db] idle client error:", err.message));

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await pool.query<T>(text, params);
  return res.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

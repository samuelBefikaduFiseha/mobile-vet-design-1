// Applies db/migrations/*.sql (in name order) to DATABASE_URL.
// Migrations are written to be idempotent, so re-running is safe.
//
//   npm run db:migrate                                   # local Docker DB (.env.local)
//   $env:DATABASE_URL="postgres://…neon…"; npm run db:migrate   # Neon / production
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const client = new pg.Client({ connectionString: url });
await client.connect();
console.log(`Migrating ${new URL(url).host}${new URL(url).pathname}`);
for (const f of files) {
  await client.query("BEGIN");
  try {
    await client.query(readFileSync(join(dir, f), "utf8"));
    await client.query("COMMIT");
    console.log(`  ✓ ${f}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(`  ✗ ${f}: ${err.message}`);
    process.exit(1);
  }
}
await client.end();

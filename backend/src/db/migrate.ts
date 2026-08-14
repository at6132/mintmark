import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";
import "../load-env.js";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required to migrate");
}

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../drizzle");
const sql = postgres(DATABASE_URL, { max: 1 });

await sql`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`;

const files = (await readdir(dir))
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  const already = await sql<{ filename: string }[]>`
    SELECT filename FROM schema_migrations WHERE filename = ${file}
  `;
  if (already.length) {
    console.log(`skip ${file}`);
    continue;
  }
  const body = await readFile(path.join(dir, file), "utf8");
  await sql.begin(async (tx) => {
    await tx.unsafe(body);
    await tx`INSERT INTO schema_migrations (filename) VALUES (${file})`;
  });
  console.log(`applied ${file}`);
}

await sql.end();
console.log("migrations complete");

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env, isProd } from "../env.js";
import * as schema from "./schema.js";

const cfg = env();
const max = cfg.DB_POOL_MAX ?? (cfg.SERVICE === "worker" ? 3 : 10);

export const sqlClient = postgres(cfg.DATABASE_URL, {
  max,
  idle_timeout: 20,
  connect_timeout: 15,
  prepare: false,
  ssl: isProd() ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle({ client: sqlClient, schema });

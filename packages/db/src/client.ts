import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { databaseUrl } from "./env.js";
import * as schema from "./schema/index.js";

export type Db = ReturnType<typeof createDb>["db"];

export function createDb(url: string = databaseUrl()) {
  const pool = new pg.Pool({ connectionString: url, max: 5 });
  const db = drizzle(pool, { schema });
  return { db, pool, close: () => pool.end() };
}

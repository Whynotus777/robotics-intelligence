import type { Db } from "@ri/db";

/** Everything a handler needs: a database and the as_of date (null = now). */
export interface ApiContext {
  db: Db;
  asOf: string | null;
}

export function context(db: Db, asOf?: string | null): ApiContext {
  return { db, asOf: asOf ?? null };
}

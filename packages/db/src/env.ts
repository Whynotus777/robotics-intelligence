import { config } from "dotenv";

// Reads DATABASE_URL from the repo-root .env (or the process environment).
config({ path: new URL("../../../.env", import.meta.url).pathname });

export function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");
  return url;
}

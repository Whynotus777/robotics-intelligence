import { sql } from "drizzle-orm";
import { createDb } from "./client.js";

// Drops everything (including drizzle's own migration bookkeeping) and recreates an empty public schema.
const { db, close } = createDb();
await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
await db.execute(sql`CREATE SCHEMA public`);
console.log("database reset: schema public recreated");
await close();

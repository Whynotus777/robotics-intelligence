import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createDb } from "./client.js";

const { db, close } = createDb();
const migrationsFolder = new URL("../drizzle", import.meta.url).pathname;
await migrate(db, { migrationsFolder });
console.log("migrations applied from", migrationsFolder);
await close();

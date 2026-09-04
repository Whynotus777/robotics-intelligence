import { serve } from "@hono/node-server";
import { createDb } from "@ri/db";
import { context } from "../context.js";
import { createApp } from "./app.js";

const port = 4000;
const { db, close } = createDb();
const server = serve({ fetch: createApp(context(db)).fetch, port }, ({ port: boundPort }) => {
  console.log(`API listening on http://localhost:${boundPort}`);
});

const shutdown = () => server.close(() => void close());
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

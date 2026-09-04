import { Hono } from "hono";
import { ZodError } from "zod";
import type { ApiContext } from "../context.js";
import { atlasRoutes } from "./routes/atlas.js";
import { claimsRoutes } from "./routes/claims.js";
import { compareRoutes } from "./routes/compare.js";
import { discoveryRoutes } from "./routes/discovery.js";
import { entitiesRoutes } from "./routes/entities.js";
import { marketsRoutes } from "./routes/markets.js";
import { robotsRoutes } from "./routes/robots.js";
import { tasksRoutes } from "./routes/tasks.js";
import { updatesRoutes } from "./routes/updates.js";

export function createApp(ctx: ApiContext) {
  const app = new Hono();
  app.route("/entities", entitiesRoutes(ctx));
  app.route("/", discoveryRoutes(ctx));
  app.route("/robots", robotsRoutes(ctx));
  app.route("/tasks", tasksRoutes(ctx));
  app.route("/markets", marketsRoutes(ctx));
  app.route("/compare", compareRoutes(ctx));
  app.route("/atlas", atlasRoutes(ctx));
  app.route("/updates", updatesRoutes(ctx));
  app.route("/claims", claimsRoutes(ctx));
  app.notFound((c) => c.json({ error: "not found" }, 404));
  app.onError((error, c) => {
    if (error instanceof ZodError) return c.json({ error: "invalid request", issues: error.issues }, 400);
    if (/not found|not a |is not a /.test(error.message)) return c.json({ error: error.message }, 404);
    console.error(error);
    return c.json({ error: "internal server error" }, 500);
  });
  return app;
}

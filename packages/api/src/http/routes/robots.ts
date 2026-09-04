import { Hono } from "hono";
import type { ApiContext } from "../../context.js";
import { robotsHandler, stackHandler } from "../../handlers.js";
import { json } from "../respond.js";

export const robotsRoutes = (ctx: ApiContext) => new Hono()
  .get("/", (c) => json(c, () => robotsHandler(ctx, c.req.query())))
  .get("/:slug/stack", (c) => json(c, () => stackHandler(ctx, { params: c.req.param(), query: c.req.query() })));

import { Hono } from "hono";
import type { ApiContext } from "../../context.js";
import { taskHandler } from "../../handlers.js";
import { json } from "../respond.js";

export const tasksRoutes = (ctx: ApiContext) => new Hono()
  .get("/:slug", (c) => json(c, () => taskHandler(ctx, { params: c.req.param(), query: c.req.query() })));

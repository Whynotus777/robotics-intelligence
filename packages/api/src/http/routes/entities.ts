import { Hono } from "hono";
import type { ApiContext } from "../../context.js";
import { entityHandler } from "../../handlers.js";
import { json } from "../respond.js";

export const entitiesRoutes = (ctx: ApiContext) => new Hono()
  .get("/:slug", (c) => json(c, () => entityHandler(ctx, { params: c.req.param(), query: c.req.query() })));

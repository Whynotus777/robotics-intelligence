import { Hono } from "hono";
import type { ApiContext } from "../../context.js";
import { marketHandler } from "../../handlers.js";
import { json } from "../respond.js";

export const marketsRoutes = (ctx: ApiContext) => new Hono()
  .get("/:slug", (c) => json(c, () => marketHandler(ctx, { params: c.req.param(), query: c.req.query() })));

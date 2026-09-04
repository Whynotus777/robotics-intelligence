import { Hono } from "hono";
import type { ApiContext } from "../../context.js";
import { compareHandler } from "../../handlers.js";
import { json } from "../respond.js";

export const compareRoutes = (ctx: ApiContext) => new Hono()
  .post("/", (c) => json(c, async () => compareHandler(ctx, await c.req.json())));

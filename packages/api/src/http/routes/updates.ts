import { Hono } from "hono";
import type { ApiContext } from "../../context.js";
import { updatesHandler } from "../../handlers.js";
import { json } from "../respond.js";

export const updatesRoutes = (ctx: ApiContext) => new Hono()
  .get("/", (c) => json(c, () => updatesHandler(ctx, c.req.query())));

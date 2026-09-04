import { Hono } from "hono";
import type { ApiContext } from "../../context.js";
import { atlasHandler } from "../../handlers.js";
import { json } from "../respond.js";

export const atlasRoutes = (ctx: ApiContext) => new Hono()
  .get("/", (c) => json(c, () => atlasHandler(ctx, c.req.query())));

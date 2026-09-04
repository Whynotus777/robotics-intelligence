import { Hono } from "hono";
import type { ApiContext } from "../../context.js";
import { exploreHandler, searchHandler, stackMatrixHandler } from "../../handlers.js";
import { json } from "../respond.js";

export const discoveryRoutes = (ctx: ApiContext) => new Hono()
  .get("/search", (c) => json(c, () => searchHandler(ctx, c.req.query())))
  .get("/explore/stack-matrix", (c) => json(c, () => stackMatrixHandler(ctx, c.req.query())))
  .get("/explore", (c) => json(c, () => exploreHandler(ctx, c.req.query())));

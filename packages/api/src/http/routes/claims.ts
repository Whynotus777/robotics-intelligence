import { Hono } from "hono";
import type { ApiContext } from "../../context.js";
import { claimEvidenceHandler } from "../../handlers.js";
import { json } from "../respond.js";

export const claimsRoutes = (ctx: ApiContext) => new Hono()
  .get("/:id/evidence", (c) => json(c, () => claimEvidenceHandler(ctx, { params: c.req.param(), query: c.req.query() })));

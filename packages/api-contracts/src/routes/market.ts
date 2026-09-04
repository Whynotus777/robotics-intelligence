import { z } from "zod";
import { Maturity } from "@ri/domain";
import { AsOfQuery, EntityChip, IsoDate } from "../common.js";

// GET /markets/:slug

export const MarketParams = z.object({ slug: z.string() });
export const MarketQuery = AsOfQuery;

export const MaturityBoardRow = z.object({
  task: EntityChip,
  domain: EntityChip,
  maturity: Maturity.nullable(),
  maturity_claim_id: z.uuid().nullable(),
  dominant_approach: EntityChip.nullable(),
  vendor_count: z.number().int().nonnegative(),
  deployment_count: z.number().int().nonnegative(),
});

export const MarketResponse = z.object({
  market: EntityChip,
  short_description: z.string().nullable(),
  /** Ancestors, root first, excluding this market. */
  path: z.array(EntityChip),
  children: z.array(EntityChip),
  /** Tasks in this market and its descendants. */
  board: z.array(MaturityBoardRow),
  as_of: IsoDate.nullable(),
});
export type MarketResponse = z.infer<typeof MarketResponse>;

import { z } from "zod";
import { EntityChip, IsoDate } from "../common.js";
import { DiscoveryFilters } from "./discovery.js";

// GET /robots?embodiment=

export const RobotsQuery = DiscoveryFilters.omit({ entity_type: true }).extend({
  as_of: IsoDate.optional(),
});
export type RobotsQuery = z.infer<typeof RobotsQuery>;

export const RobotsResponse = z.object({
  robots: z.array(EntityChip),
  as_of: IsoDate.nullable(),
});
export type RobotsResponse = z.infer<typeof RobotsResponse>;

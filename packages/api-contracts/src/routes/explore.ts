import { z } from "zod";
import { EntityChip, IsoDate } from "../common.js";
import { DiscoveryFilters } from "./discovery.js";

// GET /explore?lens=&measure=

export const EXPLORE_LENSES = ["embodiment", "market", "technology", "geography", "maturity"] as const;
export const ExploreLens = z.enum(EXPLORE_LENSES);
export type ExploreLens = z.infer<typeof ExploreLens>;

export const EXPLORE_MEASURES = ["deployments", "robots", "none"] as const;
export const ExploreMeasure = z.enum(EXPLORE_MEASURES);
export type ExploreMeasure = z.infer<typeof ExploreMeasure>;

export const ExploreQuery = DiscoveryFilters.extend({
  lens: ExploreLens.default("embodiment"),
  measure: ExploreMeasure.default("none"),
  as_of: IsoDate.optional(),
});
export type ExploreQuery = z.infer<typeof ExploreQuery>;

export const ExploreEntity = z.object({
  chip: EntityChip,
  measure_value: z.number().nullable(),
  /** Under technology and market lenses an entity may appear in several districts; this marks the anchor. */
  is_primary_membership: z.boolean(),
});

export const ExploreDistrict = z.object({
  id: z.string(),
  label: z.string(),
  /** Distinct entities in the district. */
  count: z.number().int().nonnegative(),
  entities: z.array(ExploreEntity),
});

export const ExploreRegion = z.object({
  id: z.string(),
  label: z.string(),
  /** Distinct entities across the region's districts. */
  count: z.number().int().nonnegative(),
  districts: z.array(ExploreDistrict),
});

/** Partition tree: deterministic and stable between visits. */
export const ExploreResponse = z.object({
  lens: ExploreLens,
  measure: ExploreMeasure,
  regions: z.array(ExploreRegion),
  as_of: IsoDate.nullable(),
});
export type ExploreResponse = z.infer<typeof ExploreResponse>;

import { z } from "zod";
import { EntityType } from "@ri/domain";
import { EntityChip } from "../common.js";
import { DiscoveryFilters } from "./discovery.js";

// GET /search?q=

export const SearchQuery = DiscoveryFilters.extend({
  q: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).refine(({ q, entity_type, embodiment, commercial_stage, maturity, country_code }) =>
  q !== undefined || [entity_type, embodiment, commercial_stage, maturity, country_code].some(Boolean),
  { message: "q or at least one structured filter is required" },
);
export type SearchQuery = z.infer<typeof SearchQuery>;

export const SearchResult = z.object({
  chip: EntityChip,
  entity_type: EntityType,
  match_field: z.enum(["name", "alias", "description"]),
  rank: z.number(),
});

export const SearchResponse = z.object({
  query: z.string(),
  results: z.array(SearchResult),
});
export type SearchResponse = z.infer<typeof SearchResponse>;

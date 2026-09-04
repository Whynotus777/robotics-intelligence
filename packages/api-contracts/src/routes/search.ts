import { z } from "zod";
import { EntityType } from "@ri/domain";
import { EntityChip } from "../common.js";

// GET /search?q=

export const SearchQuery = z.object({
  q: z.string().min(1).max(200),
  limit: z.number().int().min(1).max(50).default(20),
});
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

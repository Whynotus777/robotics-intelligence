import { z } from "zod";
import { Confidence } from "@ri/domain";
import { EntityChip, IsoDate } from "../common.js";
import { ExploreLens } from "./explore.js";

// projectGraph({lens, filter, as_of}) — a projection, never storage.

export const GraphFilter = z.object({
  entity_types: z.array(z.string()).optional(),
  predicates: z.array(z.string()).optional(),
  /** Restrict to the neighbourhood of these slugs (any depth 1 neighbour). */
  around: z.array(z.string()).optional(),
});

export const GraphNode = z.object({
  id: z.uuid(),
  chip: EntityChip,
  /** Region id under the requested lens, when the entity belongs to one. */
  group: z.string().nullable(),
});

export const GraphEdge = z.object({
  id: z.uuid(),
  source: z.uuid(),
  target: z.uuid(),
  predicate: z.string(),
  has_evidence: z.boolean(),
  confidence_max: Confidence.nullable(),
  valid_from: IsoDate,
  valid_to: IsoDate.nullable(),
  /** Layout hint in [0, 1]: stronger evidence and structural predicates weigh more. */
  weight: z.number().min(0).max(1),
});

export const GraphProjection = z.object({
  lens: ExploreLens,
  nodes: z.array(GraphNode),
  edges: z.array(GraphEdge),
  as_of: IsoDate.nullable(),
});
export type GraphProjection = z.infer<typeof GraphProjection>;
export type GraphNode = z.infer<typeof GraphNode>;
export type GraphEdge = z.infer<typeof GraphEdge>;
export type GraphFilter = z.infer<typeof GraphFilter>;

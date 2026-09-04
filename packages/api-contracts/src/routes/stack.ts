import { z } from "zod";
import { CANONICAL_LAYERS, Embodiment } from "@ri/domain";
import { AsOfQuery, EntityChip, EvidenceSummary, IsoDate } from "../common.js";

// GET /robots/:slug/stack

export const StackParams = z.object({ slug: z.string() });
export const StackQuery = AsOfQuery;

export const StackItem = z.object({
  entity: EntityChip,
  kind: z.enum(["product", "technology"]),
  claim_id: z.uuid(),
  qualifier: z.string().nullable(),
  evidence_summary: EvidenceSummary,
});

export const StackLayerView = z.object({
  canonical: z.enum(CANONICAL_LAYERS),
  label: z.string(),
  /** Always true in responses: non-applicable layers are omitted, applicable-but-empty layers are kept. */
  applies: z.literal(true),
  items: z.array(StackItem),
  competing_technologies: z.array(EntityChip),
  architecture_note: z
    .object({ claim_id: z.uuid(), text: z.string(), qualifier: z.string().nullable(), evidence_summary: EvidenceSummary })
    .optional(),
});

export const StackResponse = z.object({
  robot: EntityChip,
  embodiment: Embodiment,
  layers: z.array(StackLayerView),
  /** Cross-cutting safety items (stack_layer = SAFETY). */
  safety: z.array(StackItem),
  as_of: IsoDate.nullable(),
});
export type StackResponse = z.infer<typeof StackResponse>;

import { z } from "zod";
import { ChangeEventOrigin, ChangeEventType, Embodiment } from "@ri/domain";
import { ClaimValue, EntityChip, EvidenceSummary, IsoDate } from "../common.js";

// GET /updates?since=&type=&embodiment=&market=

export const UpdatesQuery = z.object({
  since: IsoDate.optional(),
  type: ChangeEventType.optional(),
  embodiment: Embodiment.optional(),
  /** Market slug; matches events whose entity targets or belongs to that market (or its descendants). */
  market: z.string().optional(),
  entity: z.string().optional(),
  /**
   * Seeded initial values are the record's starting state, not news, so they are
   * excluded unless asked for. "1"/"true" includes them.
   */
  include_seed: z
    .union([z.boolean(), z.enum(["1", "0", "true", "false"])])
    .transform((value) => value === true || value === "1" || value === "true")
    .optional()
    .default(false),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type UpdatesQuery = z.infer<typeof UpdatesQuery>;

export const ChangeEventView = z.object({
  id: z.uuid(),
  event_type: ChangeEventType,
  entity: EntityChip,
  before: ClaimValue.nullable(),
  after: ClaimValue.nullable(),
  evidence_summary: EvidenceSummary.nullable(),
  observed_at: z.iso.datetime(),
  summary: z.string(),
  origin: ChangeEventOrigin,
});

export const UpdatesResponse = z.object({
  events: z.array(ChangeEventView),
});
export type UpdatesResponse = z.infer<typeof UpdatesResponse>;
